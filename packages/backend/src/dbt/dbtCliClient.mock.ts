import { ExecaError, ExecaReturnValue } from 'execa';
import {
    DbtManifest,
    DbtRpcDocsGenerateResults,
    DbtRpcGetManifestResults,
} from 'common';

export const cliArgs = {
    dbtProjectDirectory: 'dbtProjectDirectory',
    dbtProfilesDirectory: 'dbtProfilesDirectory',
    environment: {},
    profileName: 'profileName',
    target: 'target',
};

export const expectedCommandOptions = [
    '--profiles-dir',
    'dbtProfilesDirectory',
    '--project-dir',
    'dbtProjectDirectory',
    '--target',
    'target',
    '--profile',
    'profileName',
];

export const cliMocks = {
    success: { all: 'success message' } as Partial<ExecaReturnValue>,
    error: {
        shortMessage: 'error message',
        all: 'all error messages',
    } as Partial<ExecaError>,
};
export const cliMockImplementation = {
    success: async () => cliMocks.success,
    error: async () => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw cliMocks.error;
    },
};

export const dbtProjectYml = `
name: 'jaffle_shop'
version: '0.1'
profile: 'jaffle_shop'
config-version: 2
`;

export const manifestMock: DbtManifest = {
    nodes: {},
    metadata: {
        dbt_schema_version: '',
        generated_at: '',
        adapter_type: '',
    },
};

export const catalogMock: DbtRpcDocsGenerateResults = {
    nodes: {
        key: {
            metadata: {
                type: '',
                database: '',
                schema: '',
                name: '',
            },
            columns: {},
        },
    },
};
