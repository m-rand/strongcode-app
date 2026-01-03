'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LiftColumn from './LiftColumn'

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

export default function CreateProgram() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [calculatedResults, setCalculatedResults] = useState<ProgramData | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isNewClient, setIsNewClient] = useState(true)

  // Default lift configuration
  const defaultLiftConfig = (oneRM: number, volume: number) => ({
    oneRM,
    rounding: 2.5,
    volume,
    weight_65: Math.round((oneRM * 0.65) / 2.5) * 2.5,
    weight_75: Math.round((oneRM * 0.75) / 2.5) * 2.5,
    weight_85: Math.round((oneRM * 0.85) / 2.5) * 2.5,
    weight_90: Math.round((oneRM * 0.925) / 2.5) * 2.5,
    weight_95: Math.round((oneRM * 0.95) / 2.5) * 2.5,
    zone_75_percent: 45,
    zone_85_percent: 13,
    zone_90_total_reps: 4,
    zone_95_total_reps: 0,
    volume_pattern_main: '3a',
    volume_pattern_8190: '3a',
  })

  // Form state - now with 3 lifts
  const [formData, setFormData] = useState({
    // Shared client info
    clientName: 'Katerina Balasova',
    delta: 'advanced',
    block: 'prep',
    sessions_per_week: 3,
    session_distribution: 'd25_33_42',

    // Per-lift configurations
    lifts: {
      squat: defaultLiftConfig(142.5, 350),
      bench_press: defaultLiftConfig(85, 300),
      deadlift: defaultLiftConfig(170, 250),
    }
  })

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setIsSaved(false)

    try {
      // Call API to calculate targets
      const response = await fetch('/api/create-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to calculate program')
      }

      const result = await response.json()

      // Load the calculated program data
      const programResponse = await fetch(`/api/program?client=${result.client}&filename=${result.filename}`)
      const programData = await programResponse.json()

      setCalculatedResults(programData)
    } catch (error) {
      console.error('Error calculating program:', error)
      alert('Nepodařilo se vypočítat program')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Program is already saved by the API, just mark as saved
    setIsSaved(true)
    alert('Program byl úspěšně uložen!')
  }

  // Calculate weight from 1RM and percentage
  const calculateWeight = (oneRM: number, percentage: number, rounding: number): number => {
    const raw = oneRM * (percentage / 100)
    return Math.round(raw / rounding) * rounding
  }

  // Calculate actual percentage from weight and 1RM
  const calculateActualPercentage = (weight: number, oneRM: number): number => {
    if (oneRM === 0) return 0
    return Math.round((weight / oneRM) * 100 * 10) / 10 // Round to 1 decimal
  }

  // Calculate percentage from absolute reps and total volume
  const calculatePercentageFromReps = (reps: number, totalVolume: number): number => {
    if (totalVolume === 0) return 0
    return Math.round((reps / totalVolume) * 100 * 10) / 10 // Round to 1 decimal
  }

  // Update shared field (clientName, delta, etc.)
  const updateSharedField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Update lift-specific field
  const updateLiftField = (lift: 'squat' | 'bench_press' | 'deadlift', field: string, value: any) => {
    setFormData(prev => {
      const newLifts = { ...prev.lifts }
      const liftData = { ...newLifts[lift], [field]: value }

      // Auto-calculate zone weights when 1RM or rounding changes
      if (field === 'oneRM' || field === 'rounding') {
        const oneRM = field === 'oneRM' ? value : liftData.oneRM
        const rounding = field === 'rounding' ? value : liftData.rounding

        liftData.weight_65 = calculateWeight(oneRM, 65, rounding)
        liftData.weight_75 = calculateWeight(oneRM, 75, rounding)
        liftData.weight_85 = calculateWeight(oneRM, 85, rounding)
        liftData.weight_90 = calculateWeight(oneRM, 92.5, rounding)
        liftData.weight_95 = calculateWeight(oneRM, 95, rounding)
      }

      newLifts[lift] = liftData
      return { ...prev, lifts: newLifts }
    })
  }

  // Handle number input with decimal comma/point support
  const handleLiftNumberInput = (lift: 'squat' | 'bench_press' | 'deadlift', field: string, inputValue: string) => {
    // Replace comma with dot for decimal separator
    const normalized = inputValue.replace(',', '.')

    // Allow empty string, numbers, and numbers ending with dot
    if (normalized === '' || normalized === '-' || /^-?\d*\.?\d*$/.test(normalized)) {
      const numValue = parseFloat(normalized)
      // Only update if it's a valid number or empty/partial input
      if (!isNaN(numValue)) {
        updateLiftField(lift, field, numValue)
      }
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Vytvořit Nový Program
          </h1>
          <p className="text-gray-600">
            Zadej parametry pro všechny 3 cviky (Squat, Bench Press, Deadlift)
          </p>
        </header>

        <form onSubmit={handleCalculate} className="space-y-6">
          {/* Client Selector */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Výběr klienta</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ záznamu
                </label>
                <select
                  value={isNewClient ? 'new' : 'existing'}
                  onChange={(e) => setIsNewClient(e.target.value === 'new')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                >
                  <option value="new">Nový klient</option>
                  <option value="existing">Existující klient</option>
                </select>
              </div>
              {!isNewClient && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vybrat klienta
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                    onChange={(e) => updateSharedField('clientName', e.target.value)}
                  >
                    <option value="Katerina Balasova">Katerina Balasova</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Informace o klientovi</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jméno klienta
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => updateSharedField('clientName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                  required
                  disabled={!isNewClient}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Úroveň (Delta)
                </label>
                <select
                  value={formData.delta}
                  onChange={(e) => updateSharedField('delta', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                >
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="elite">Elite</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block
                </label>
                <select
                  value={formData.block}
                  onChange={(e) => updateSharedField('block', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                >
                  <option value="prep">Prep</option>
                  <option value="peak">Peak</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3-Column Layout for Lifts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <LiftColumn
              liftName="squat"
              liftData={formData.lifts.squat}
              onUpdate={(field, value) => updateLiftField('squat', field, value)}
              onNumberInput={(field, value) => handleLiftNumberInput('squat', field, value)}
              calculateActualPercentage={calculateActualPercentage}
              calculatePercentageFromReps={calculatePercentageFromReps}
            />

            <LiftColumn
              liftName="bench_press"
              liftData={formData.lifts.bench_press}
              onUpdate={(field, value) => updateLiftField('bench_press', field, value)}
              onNumberInput={(field, value) => handleLiftNumberInput('bench_press', field, value)}
              calculateActualPercentage={calculateActualPercentage}
              calculatePercentageFromReps={calculatePercentageFromReps}
            />

            <LiftColumn
              liftName="deadlift"
              liftData={formData.lifts.deadlift}
              onUpdate={(field, value) => updateLiftField('deadlift', field, value)}
              onNumberInput={(field, value) => handleLiftNumberInput('deadlift', field, value)}
              calculateActualPercentage={calculateActualPercentage}
              calculatePercentageFromReps={calculatePercentageFromReps}
            />
          </div>

          {/* Sessions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Tréninkové sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Počet sessions v týdnu
                </label>
                <select
                  value={formData.sessions_per_week}
                  onChange={(e) => updateSharedField('sessions_per_week', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                >
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Distribution
                </label>
                <select
                  value={formData.session_distribution}
                  onChange={(e) => updateSharedField('session_distribution', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
                >
                  {formData.sessions_per_week === 3 ? (
                    <>
                      <option value="d25_33_42">d25_33_42 (L-M-H)</option>
                      <option value="d20_35_45">d20_35_45</option>
                      <option value="d22_28_50">d22_28_50</option>
                      <option value="d20_30_50">d20_30_50</option>
                      <option value="d15_35_50">d15_35_50</option>
                      <option value="d15_30_55">d15_30_55</option>
                    </>
                  ) : (
                    <>
                      <option value="d40_60">d40_60</option>
                      <option value="d35_65">d35_65</option>
                      <option value="d30_70">d30_70</option>
                      <option value="d25_75">d25_75</option>
                      <option value="d20_80">d20_80</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Počítám...' : 'Vypočítat Program'}
            </button>
          </div>
        </form>

        {/* Results Display */}
        {calculatedResults && (
          <div className="mt-8 space-y-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <h2 className="text-xl font-semibold text-green-900 mb-2">
                Program úspěšně vypočítán!
              </h2>
              <p className="text-green-700">
                Zkontroluj výsledky níže a klikni na "Uložit" pro finální uložení.
              </p>
            </div>

            {/* Results Tables */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Vypočítané targety</h2>
              {Object.entries(calculatedResults.calculated).map(([lift, liftData], index) => {
                const summary = liftData._summary

                // Format lift name (e.g., "bench_press" -> "Bench Press")
                const liftLabel = lift === 'squat' ? 'Squat' :
                                 lift === 'bench_press' ? 'Bench Press' :
                                 lift === 'deadlift' ? 'Deadlift' : lift

                // Get session distribution pattern info
                const sessionDistPattern = formData.session_distribution
                const sessionPercentages = sessionDistPattern === 'd25_33_42' ? [25, 33, 42] :
                                          sessionDistPattern === 'd20_35_45' ? [20, 35, 45] :
                                          sessionDistPattern === 'd22_28_50' ? [22, 28, 50] :
                                          sessionDistPattern === 'd20_30_50' ? [20, 30, 50] :
                                          sessionDistPattern === 'd15_35_50' ? [15, 35, 50] :
                                          sessionDistPattern === 'd15_30_55' ? [15, 30, 55] :
                                          sessionDistPattern === 'd40_60' ? [40, 60] :
                                          sessionDistPattern === 'd35_65' ? [35, 65] :
                                          sessionDistPattern === 'd30_70' ? [30, 70] :
                                          sessionDistPattern === 'd25_75' ? [25, 75] :
                                          sessionDistPattern === 'd20_80' ? [20, 80] : [25, 33, 42]

                return (
                  <div key={lift}>
                    {index > 0 && <hr className="my-8 border-gray-300" />}
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-2xl font-semibold text-center text-blue-900">{liftLabel}</h3>
                      </div>

                    {/* Table 1: Intensity Zones by Week */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">Int.zone / Week</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">1</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">2</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">3</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">4</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">%1RM / NL</td>
                            {[1, 2, 3, 4].map(weekNum => {
                              const weekData = liftData[`week_${weekNum}`]
                              return (
                                <td key={weekNum} className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">
                                  {weekData?.total_reps || 0}
                                </td>
                              )
                            })}
                          </tr>
                          {['55', '65', '75', '85', '90', '95'].map(zone => (
                            <tr key={zone} className={zone === '55' || zone === '90' || zone === '95' ? 'bg-gray-50' : ''}>
                              <td className="border border-gray-300 px-4 py-2 text-gray-900">
                                {zone === '90' ? '92,50%' : `${zone}%`}
                              </td>
                              {[1, 2, 3, 4].map(weekNum => {
                                const weekData = liftData[`week_${weekNum}`]
                                const reps = weekData?.zones?.[zone] || 0
                                return (
                                  <td key={weekNum} className={`border border-gray-300 px-4 py-2 text-center ${reps === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {reps}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-semibold">
                            <td className="border border-gray-300 px-4 py-2 text-gray-900">ARI</td>
                            {[1, 2, 3, 4].map(weekNum => {
                              const weekData = liftData[`week_${weekNum}`]
                              return (
                                <td key={weekNum} className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                                  {weekData?.ari || 0}
                                </td>
                              )
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Table 2: Session Distribution */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-green-100">
                            <th className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                              {formData.sessions_per_week}
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900" colSpan={4}>
                              days / week
                            </th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                              {sessionDistPattern}
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900" colSpan={4}>
                              distribution in a week
                            </th>
                          </tr>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-center text-gray-900">LMH</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">#reps</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">#reps</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">#reps</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">#reps</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionPercentages.map((pct, sessionIdx) => (
                            <tr key={sessionIdx}>
                              <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-900">
                                {pct}
                              </td>
                              {[1, 2, 3, 4].map(weekNum => {
                                const weekData = liftData[`week_${weekNum}`]
                                const sessions = weekData?.sessions || {}
                                const sessionKeys = Object.keys(sessions)
                                const sessionData = sessions[sessionKeys[sessionIdx]]
                                const reps = sessionData?.total || 0
                                return (
                                  <td key={weekNum} className="border border-gray-300 px-4 py-2 text-center text-gray-900">
                                    {reps}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setCalculatedResults(null)}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Upravit vstup
              </button>
              <button
                onClick={handleSave}
                disabled={isSaved}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {isSaved ? 'Uloženo ✓' : 'Uložit program'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
