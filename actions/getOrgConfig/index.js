/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const { Core } = require('@adobe/aio-sdk');
const {
  errorResponse,
} = require('../utils');
const config = require('../orgConfig.json');

/**
 * Main function that will be executed by Adobe I/O Runtime.
 *
 * @param {object} params The action parameters.
 * @param {string} params.organizationId The id of the organization to look up in the config.
 * @param {object} params.__ow_headers The headers of the request.
 * @param {string} params.__ow_headers['ims-org-id'] The ims-org-id header of the request.
 * @param {string} params.LOG_LEVEL The log level to use.
 *
 * @returns {Promise<object>} The response with a statusCode and a body.
 */
async function main(params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });
  const { organizationId } = params;
  const imsOrgId = params.__ow_headers && params.__ow_headers['ims-org-id'];

  try {
    // check for missing request input parameters and headers
    const organization = config.organizations.find((org) => org.id === organizationId);

    if (!organization) {
      return errorResponse(400, 'organization not found', logger);
    }
    const copyOrganization = { ...organization };
    if (organization && organization.featureFlags) {
      copyOrganization.featureFlags = organization.featureFlags[imsOrgId] || [];

      if (organization.featureFlags['*']) {
        copyOrganization.featureFlags = [
          ...copyOrganization.featureFlags,
          ...organization.featureFlags['*'],
        ];
      }
    }

    const response = {
      statusCode: 200,
      body: copyOrganization,
    };

    // log the response status code
    logger.info(`${response.statusCode}: successful request`);
    return response;
  } catch (error) {
    // log any server errors
    logger.error(error);
    // return with 500
    return errorResponse(500, 'server error', logger);
  }
}

module.exports = {
  main,
};
