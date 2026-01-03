'use client'

import { useEffect, useState } from 'react'

interface ProgramData {
  client: {
    name: string
    delta: string
  }
  program_info: {
    block: string
    start_date: string
    weeks: number
  }
  calculated: {
    [lift: string]: {
      _summary: {
        total_nl: number
        block_ari: number
        zone_distribution: { [zone: string]: number }
        zone_totals: { [zone: string]: number }
      }
      [key: string]: any
    }
  }
}

export default function Home() {
  const [program, setProgram] = useState<ProgramData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load the example program JSON
    fetch('/api/program')
      .then(res => res.json())
      .then(data => {
        setProgram(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load program:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Načítání programu...</div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-red-600">Nepodařilo se načíst program</div>
      </div>
    )
  }

  const lift = Object.keys(program.calculated)[0]
  const liftData = program.calculated[lift]
  const summary = liftData._summary

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              StrongCode 60
            </h1>
            <p className="text-gray-600">
              Powerlifting Program - {program.client.name}
            </p>
          </div>
          <a
            href="/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Nový Program
          </a>
        </header>

        {/* Program Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Program Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Client</div>
              <div className="text-lg font-medium">{program.client.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Level</div>
              <div className="text-lg font-medium capitalize">{program.client.delta}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Block</div>
              <div className="text-lg font-medium capitalize">{program.program_info.block}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Weeks</div>
              <div className="text-lg font-medium">{program.program_info.weeks}</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 capitalize">{lift} Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{summary.total_nl}</div>
              <div className="text-sm text-gray-600 mt-1">Total Volume (NL)</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{summary.block_ari}%</div>
              <div className="text-sm text-gray-600 mt-1">Block ARI</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{program.program_info.weeks}</div>
              <div className="text-sm text-gray-600 mt-1">Weeks</div>
            </div>
          </div>
        </div>

        {/* Zone Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Intensity Zone Distribution</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600">Zone</th>
                  <th className="text-right py-3 px-4 text-gray-600">Percentage</th>
                  <th className="text-right py-3 px-4 text-gray-600">Total Reps</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.zone_distribution).map(([zone, pct]) => (
                  <tr key={zone} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{zone}%</td>
                    <td className="py-3 px-4 text-right">{pct}%</td>
                    <td className="py-3 px-4 text-right font-semibold">{summary.zone_totals[zone]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Weekly Breakdown</h2>
          <div className="space-y-6">
            {[1, 2, 3, 4].map(weekNum => {
              const weekData = liftData[`week_${weekNum}`]
              if (!weekData) return null

              return (
                <div key={weekNum} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Week {weekNum}</h3>
                    <div className="flex gap-4">
                      <span className="text-sm text-gray-600">
                        Total: <span className="font-semibold">{weekData.total_reps} reps</span>
                      </span>
                      <span className="text-sm text-gray-600">
                        ARI: <span className="font-semibold">{weekData.ari}%</span>
                      </span>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {Object.entries(weekData.sessions).map(([day, sessionData]: [string, any]) => (
                      <div key={day} className="bg-gray-50 rounded p-3">
                        <div className="font-medium capitalize mb-2">{day}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Total: {sessionData.total} reps
                        </div>
                        <div className="space-y-1 text-xs">
                          {Object.entries(sessionData.zones).map(([zone, reps]: [string, any]) => (
                            reps > 0 && (
                              <div key={zone} className="flex justify-between">
                                <span>{zone}%:</span>
                                <span className="font-medium">{reps} reps</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
