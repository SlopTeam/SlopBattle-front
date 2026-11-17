import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  // The back's schema is code-first and only exists in memory: introspect a running back
  schema: process.env.VITE_API_URL ?? 'http://localhost:3000/graphql',
  // Documents are the `/* GraphQL */` strings of src/api
  documents: ['src/api/**/*.ts', '!src/api/generated/**', '!src/api/**/__tests__/**'],
  generates: {
    'src/api/generated/graphql.ts': {
      // typescript-operations also emits the input types the documents use
      plugins: ['typescript-operations'],
      config: {
        useTypeImports: true,
        skipTypename: true,
        enumsAsTypes: true,
        maybeValue: 'T | null',
        strictScalars: true,
        scalars: {
          // `ID` fields arrive as strings, see docs/agents/api.md
          ID: 'string',
          // Full ISO timestamp
          DateTime: 'string',
        },
      },
    },
  },
  hooks: { afterOneFileWrite: ['prettier --write'] },
}

export default config
