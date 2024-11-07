/* 
* <license header>
*/

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn()
  }
}))

const { Core } = require('@adobe/aio-sdk')
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)

const action = require('./../actions/getOrgConfig/index.js');
const orgConfig = require('./../actions/orgConfig.json')

beforeEach(() => {
  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
  mockLoggerInstance.debug.mockReset()
  mockLoggerInstance.error.mockReset()
})

describe('getOrgConfig', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })

  test('should set logger to use LOG_LEVEL param', async () => {
    await action.main({ LOG_LEVEL: 'debug' })
    expect(Core.Logger).toHaveBeenCalledWith(expect.any(String), { level: 'debug' })
  })

  test('missing organizationId, should return 400', async () => {
    const response = await action.main({})
    expect(response).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'organization not found' }
      }
    })
  })

  test('invalid organizationId, should return 400', async () => {
    const response = await action.main({ organizationId: 'invalid-id' })
    expect(response).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'organization not found' }
      }
    })
  })

  test('valid organizationId, should return 200 with org data', async () => {
    const validOrgId = orgConfig.organizations[0].id
    const validImsOrgId = Object.keys(orgConfig.organizations[0].featureFlags)[0]
    const response = await action.main({ 
      organizationId: validOrgId,
      __ow_headers: { 'ims-org-id': validImsOrgId }
    })
    expect(response).toEqual({
      statusCode: 200,
      body: expect.objectContaining({
        id: validOrgId,
        featureFlags: expect.any(Array)
      })
    })
  })

  test('should include global feature flags', async () => {
    const orgWithGlobalFlags = orgConfig.organizations.find(org => org.featureFlags && org.featureFlags['*'])
    if (orgWithGlobalFlags) {
      const validImsOrgId = Object.keys(orgWithGlobalFlags.featureFlags).find(key => key !== '*')
      const response = await action.main({
        organizationId: orgWithGlobalFlags.id,
        __ow_headers: { 'ims-org-id': validImsOrgId }
      })
      expect(response.body.featureFlags).toEqual(
        expect.arrayContaining([
          ...orgWithGlobalFlags.featureFlags[validImsOrgId],
          ...orgWithGlobalFlags.featureFlags['*']
        ])
      )
    } else {
      console.warn('No organization with global feature flags found in config. Skipping test.')
    }
  })

  test('if there is an error should return a 500 and log the error', async () => {
    const mockError = new Error('test error')
    jest.spyOn(orgConfig.organizations, 'find').mockImplementation(() => {
      throw mockError
    })
    const response = await action.main({ organizationId: 'any-id' })
    expect(response).toEqual({
      error: {
        statusCode: 500,
        body: { error: 'server error' }
      }
    })
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(mockError)
  })
})