import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ErrorObject, ValidateFunction } from 'ajv'

export interface SchemaValidationResult {
  valid: boolean
  errors: string[]
  schemaVersion?: string
}

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

const SCHEMA_PATHS: Record<string, string> = {
  '1.0': '../schemas/v1.0/program.schema.json',
  '1.1': '../schemas/program-complete.schema.json',
  '1.2': '../schemas/program-complete.schema.json',
}

const validatorPromises = new Map<string, Promise<ValidateFunction>>()

const formatAjvErrors = (errors: ErrorObject[] | null | undefined): string[] => {
  if (!errors?.length) return ['Unknown schema validation error']

  return errors.map((error) => {
    const pathRef = error.instancePath || '/'
    const message = error.message || 'invalid value'
    return `${pathRef} ${message}`
  })
}

const normalizeSchemaVersion = (rawVersion: unknown): string | null => {
  if (typeof rawVersion !== 'string') return null
  const trimmed = rawVersion.trim()
  if (!trimmed) return null
  return trimmed
}

const resolveSchemaPath = (schemaVersion: string): string | null => {
  if (SCHEMA_PATHS[schemaVersion]) {
    return SCHEMA_PATHS[schemaVersion]
  }

  return null
}

const getValidator = async (schemaVersion: string): Promise<ValidateFunction> => {
  const existing = validatorPromises.get(schemaVersion)
  if (existing) return existing

  const relativePath = resolveSchemaPath(schemaVersion)
  if (!relativePath) {
    throw new Error(`Unsupported schema_version: ${schemaVersion}`)
  }

  const promise = (async () => {
    const schemaPath = path.resolve(process.cwd(), relativePath)
    const schemaRaw = await readFile(schemaPath, 'utf-8')
    const schema = JSON.parse(schemaRaw)
    return ajv.compile(schema)
  })()

  validatorPromises.set(schemaVersion, promise)
  return promise
}

export async function validateProgramWithVersion(data: unknown): Promise<SchemaValidationResult> {
  const payload = (data && typeof data === 'object') ? (data as Record<string, unknown>) : null
  const schemaVersion = normalizeSchemaVersion(payload?.schema_version)

  if (!schemaVersion) {
    return {
      valid: false,
      errors: ['/schema_version is required'],
    }
  }

  try {
    const validate = await getValidator(schemaVersion)
    const valid = validate(data)

    if (valid) {
      return { valid: true, errors: [], schemaVersion }
    }

    return {
      valid: false,
      errors: formatAjvErrors(validate.errors),
      schemaVersion,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Schema validation failed to initialize'
    return {
      valid: false,
      errors: [message],
      schemaVersion,
    }
  }
}
