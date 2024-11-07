/* 
* <license header>
*/

const { Config } = require('@adobe/aio-sdk').Core
const fs = require('fs')
const fetch = require('node-fetch')

// get action url
const namespace = Config.get('runtime.namespace')
const hostname = Config.get('cna.hostname') || 'adobeioruntime.net'
const packagejson = JSON.parse(fs.readFileSync('package.json').toString())
const runtimePackage = 'aem-success-studio-actions'
const actionUrl = `https://${namespace}.${hostname}/api/v1/web/${runtimePackage}/organizations`

// The deployed actions are secured with the `require-adobe-auth` annotation.
// If the authorization header is missing, Adobe I/O Runtime returns with a 401 before the action is executed.
test('returns a 401 when missing Authorization header', async () => {
  const res = await fetch(actionUrl)
  expect(res).toEqual(expect.objectContaining({
    status: 401
  }))
})

test('returns a 400 when missing organizationId parameter', async () => {
  const res = await fetch(actionUrl, {
    headers: {
      'Authorization': 'Bearer fake',
      'x-gw-ims-org-id': 'fake-org-id'
    }
  })
  expect(res).toEqual(expect.objectContaining({
    status: 400
  }))
  const body = await res.json()
  expect(body.error).toBe('organization not found')
})

test('returns a 200 with organization data for valid input', async () => {
  const res = await fetch(actionUrl + '?organizationId=f3324d93-76e9-4dd6-9473-50a7c7873c8e', {
    headers: {
      'Authorization': 'Bearer fake',
      'x-gw-ims-org-id': '8C6043F15F43B6390A49401A@AdobeOrg'
    }
  })
  expect(res).toEqual(expect.objectContaining({
    status: 200
  }))
  const body = await res.json()
  expect(body).toEqual(expect.objectContaining({
    id: 'f3324d93-76e9-4dd6-9473-50a7c7873c8e',
    featureFlags: ['experiments']
  }))
})