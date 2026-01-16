import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    // Helper to build lift config from formData
    const buildLiftConfig = (liftData: any, sessions_per_week: number, session_distribution: string) => ({
      volume: liftData.volume,
      rounding: liftData.rounding,
      weights: {
        '65': liftData.weight_65,
        '75': liftData.weight_75,
        '85': liftData.weight_85,
        '90': liftData.weight_90,
        '95': liftData.weight_95,
      },
      intensity_distribution: {
        '75_percent': liftData.zone_75_percent,
        '85_percent': liftData.zone_85_percent,
        '90_total_reps': liftData.zone_90_total_reps,
        '95_total_reps': liftData.zone_95_total_reps,
        '65_percent': null,
      },
      volume_pattern_main: liftData.volume_pattern_main,
      volume_pattern_8190: liftData.volume_pattern_8190,
      sessions_per_week,
      session_distribution,
    })

    // Build INPUT JSON with all 3 lifts
    const clientSlug = formData.clientName.toLowerCase().replace(/\s+/g, '-')
    const programData = {
      schema_version: '1.0',
      meta: {
        filename: `${new Date().toISOString().split('T')[0]}_${clientSlug}_${formData.block}_all_lifts.json`,
        created_at: new Date().toISOString(),
        created_by: 'Web Form',
        status: 'draft',
      },
      client: {
        name: formData.clientName,
        delta: formData.delta,
        one_rm: {
          squat: formData.lifts.squat.oneRM,
          bench_press: formData.lifts.bench_press.oneRM,
          deadlift: formData.lifts.deadlift.oneRM,
        },
      },
      program_info: {
        block: formData.block,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        weeks: 4,
      },
      input: {
        squat: buildLiftConfig(formData.lifts.squat, formData.sessions_per_week, formData.session_distribution),
        bench_press: buildLiftConfig(formData.lifts.bench_press, formData.sessions_per_week, formData.session_distribution),
        deadlift: buildLiftConfig(formData.lifts.deadlift, formData.sessions_per_week, formData.session_distribution),
      },
    }

    // Save INPUT JSON to temp file
    const tempDir = path.join(process.cwd(), '..', 'data', 'temp')
    await fs.mkdir(tempDir, { recursive: true })

    const tempFilename = `temp_${Date.now()}.json`
    const tempPath = path.join(tempDir, tempFilename)

    await fs.writeFile(tempPath, JSON.stringify(programData, null, 2))

    // Run Python script
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'calculate_targets.py')
    const pythonPath = path.join(process.cwd(), '..', 'scripts', 'venv', 'bin', 'python')

    console.log('Running:', pythonPath, scriptPath, tempPath)

    const { stdout, stderr } = await execAsync(`${pythonPath} ${scriptPath} ${tempPath}`)

    if (stderr) {
      console.error('Python stderr:', stderr)
    }

    console.log('Python stdout:', stdout)

    // Read the calculated result
    const resultData = await fs.readFile(tempPath, 'utf8')
    const result = JSON.parse(resultData)

    // Save to proper location
    const clientDir = path.join(process.cwd(), '..', 'data', 'clients', clientSlug, 'programs')
    await fs.mkdir(clientDir, { recursive: true })

    const finalPath = path.join(clientDir, programData.meta.filename)
    await fs.writeFile(finalPath, JSON.stringify(result, null, 2))

    // Clean up temp file
    await fs.unlink(tempPath)

    return NextResponse.json({
      success: true,
      filename: programData.meta.filename,
      client: clientSlug,
    })
  } catch (error: any) {
    console.error('Error creating program:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create program',
      },
      { status: 500 }
    )
  }
}
