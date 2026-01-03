'use client'

interface LiftColumnProps {
  liftName: 'squat' | 'bench_press' | 'deadlift'
  liftData: any
  onUpdate: (field: string, value: any) => void
  onNumberInput: (field: string, value: string) => void
  calculateActualPercentage: (weight: number, oneRM: number) => number
  calculatePercentageFromReps: (reps: number, totalVolume: number) => number
}

export default function LiftColumn({
  liftName,
  liftData,
  onUpdate,
  onNumberInput,
  calculateActualPercentage,
  calculatePercentageFromReps
}: LiftColumnProps) {
  const liftLabel = liftName === 'squat' ? 'Squat' :
                    liftName === 'bench_press' ? 'Bench Press' : 'Deadlift'

  return (
    <div className="space-y-6">
      {/* Lift Header */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-xl font-semibold text-center text-blue-900">{liftLabel}</h3>
      </div>

      {/* Basic Parameters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold mb-4">Základní parametry</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              1RM (kg)
            </label>
            <input
              type="number"
              step="any"
              value={liftData.oneRM}
              onChange={(e) => onNumberInput('oneRM', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rounding (kg)
            </label>
            <select
              value={liftData.rounding}
              onChange={(e) => onUpdate('rounding', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
            >
              <option value="1.0">1.0</option>
              <option value="2.5">2.5</option>
              <option value="5.0">5.0</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Volume (Monthly NL)
            </label>
            <input
              type="number"
              value={liftData.volume}
              onChange={(e) => onUpdate('volume', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600"
              required
            />
          </div>
        </div>
      </div>

      {/* Zone Weights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold mb-4">Váhy pro zóny (kg)</h4>
        <div className="space-y-3">
          {[
            { zone: '65', label: '65% zóna' },
            { zone: '75', label: '75% zóna' },
            { zone: '85', label: '85% zóna' },
            { zone: '90', label: '90% zóna (92.5%)' },
            { zone: '95', label: '95% zóna' }
          ].map(({ zone, label }) => (
            <div key={zone}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {label}
                <span className="ml-2 text-xs text-gray-500">
                  ({calculateActualPercentage(liftData[`weight_${zone}`], liftData.oneRM)}%)
                </span>
              </label>
              <input
                type="number"
                step="any"
                value={liftData[`weight_${zone}`]}
                onChange={(e) => onNumberInput(`weight_${zone}`, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Intensity Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold mb-4">Distribuce intenzity</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              65% zóna (auto)
            </label>
            <input
              type="number"
              value={Math.round((100 - liftData.zone_75_percent - liftData.zone_85_percent -
                calculatePercentageFromReps(liftData.zone_90_total_reps, liftData.volume) -
                calculatePercentageFromReps(liftData.zone_95_total_reps, liftData.volume)) * 10) / 10}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              75% zóna (%)
            </label>
            <input
              type="number"
              value={liftData.zone_75_percent}
              onChange={(e) => onUpdate('zone_75_percent', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              85% zóna (%)
            </label>
            <input
              type="number"
              value={liftData.zone_85_percent}
              onChange={(e) => onUpdate('zone_85_percent', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              90% zóna (reps)
              <span className="ml-1 text-xs text-gray-500">
                = {calculatePercentageFromReps(liftData.zone_90_total_reps, liftData.volume)}%
              </span>
            </label>
            <input
              type="number"
              value={liftData.zone_90_total_reps}
              onChange={(e) => onUpdate('zone_90_total_reps', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              95% zóna (reps)
              <span className="ml-1 text-xs text-gray-500">
                = {calculatePercentageFromReps(liftData.zone_95_total_reps, liftData.volume)}%
              </span>
            </label>
            <input
              type="number"
              value={liftData.zone_95_total_reps}
              onChange={(e) => onUpdate('zone_95_total_reps', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Volume Patterns */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold mb-4">Volume Patterns</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Main Pattern
            </label>
            <select
              value={liftData.volume_pattern_main}
              onChange={(e) => onUpdate('volume_pattern_main', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600 text-sm"
            >
              {['1', '2a', '2b', '2c', '3a', '3b', '3c', '4', '1-3a', '1-3b', '3-1a', '3-1b', '2-4a', '2-4b', '4-2a', '4-2b'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              81-90% Pattern
            </label>
            <select
              value={liftData.volume_pattern_8190}
              onChange={(e) => onUpdate('volume_pattern_8190', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-600 text-sm"
            >
              {['1', '2a', '2b', '2c', '3a', '3b', '3c', '4', '1-3a', '1-3b', '3-1a', '3-1b', '2-4a', '2-4b', '4-2a', '4-2b'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
