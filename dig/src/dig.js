'use strict';

/**
 * Formats 'A' records into slack blocks or mattermost markdown.
 * @param {array} records - Array returned by the resolve func.
 * @param {string} hostname - The hostname for which the request is made.
 * @returns {array} - An array of formatted slack blocks.
 */
const formatARecords = (records, {hostname, isSlack}) => {
  const output = [];
  for (const record of records) {
    if (isSlack) {
      output.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${hostname}`
          },
          {
            type: 'mrkdwn',
            text: `Type: *A*`
          },
          {
            type: 'mrkdwn',
            text: `TTL: ${record.ttl}`
          },
          {
            type: 'mrkdwn',
            text: `IP: \`${record.address}\``
          }
        ]
      });
    } else {
      output.push(
        `${hostname} Type: **A** TTL: \`${record.ttl}\` IP: \`${record.address}\``
      );
    }
  }

  return output;
};

/**
 * Format 'AAAA' records into slack blocks.
 * @param {array} records - Array returned by the resolve func.
 * @param {string} hostname - The hostname to which the request is made.
 * @returns {array} - An array of formatted slack blocks.
 */
const formatAAAARecords = (records, hostname) => {
  const output = [];
  for (const record of records) {
    if (isSlack) {
      output.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${hostname}`
          },
          {
            type: 'mrkdwn',
            text: `Type: *AAAA*`
          },
          {
            type: 'mrkdwn',
            text: `TTL: ${record.ttl}`
          },
          {
            type: 'mrkdwn',
            text: `IP: \`${record.address}\``
          }
        ]
      });
    } else {
      output.push(
        `${hostname} Type: **AAAA** TTL: \`${record.ttl}\` IP: \`${record.address}\``
      );
    }
  }

  return output;
};

/**
 * Format 'MX' records into slack blocks.
 * @param {array} records - Array returned by the resolve func.
 * @param {string} hostname - The hostname to which the request is made.
 * @returns {array} - An array of formatted slack blocks.
 */
const formatMXRecords = (records, {hostname, isSlack}) => {
  const output = [];
  for (const record of records) {
    if (isSlack) {
      output.push({
        type: 'context',
        elements: [
          {type: 'mrkdwn', text: `${hostname}`},
          {type: 'mrkdwn', text: `\`${record.exchange}\``},
          {type: 'mrkdwn', text: `Priority: \`${record.priority}\``}
        ]
      });
    } else {
      output.push(
        `${hostname} \`${record.exchange}\` Priority: \`${record.priority}\``
      );
    }
  }

  return output;
};

/**
 * Format 'TXT' records into slack blocks.
 * @param {array} records - Array returned by the resolve func.
 * @param {string} hostname - The hostname to which the request is made.
 * @returns {array} - An array of formatted slack blocks.
 */
const formatTXTRecords = (records, {hostname, isSlack}) => {
  const output = [];
  for (const record of records) {
    if (isSlack) {
      output.push({
        type: 'context',
        elements: [
          {type: 'mrkdwn', text: `${hostname}`},
          {type: 'mrkdwn', text: `Type: *TXT*`},
          {type: 'mrkdwn', text: `\`${record[0]}\``}
        ]
      });
    } else {
      output.push(`${hostname} Type: **TXT** \`${record[0]}\``);
    }
  }

  return output;
};

/**
 * Format 'NS' records into slack blocks.
 * @param {array} records - Array returned by the resolve func.
 * @param {string} hostname - The hostname to which the request is made.
 * @returns {array} - An array of formatted slack blocks.
 */
const formatNSRecords = (records, {hostname, isSlack}) => {
  const output = [];
  for (const record of records) {
    if (isSlack) {
      output.push({
        type: 'context',
        elements: [
          {type: 'mrkdwn', text: `${hostname}`},
          {type: 'mrkdwn', text: `Type: *NS*`},
          {type: 'mrkdwn', text: `\`${record}\``}
        ]
      });
    } else {
      output.push(`${hostname} Type: **NS** \`${record}\``);
    }
  }

  return output;
};

const formatSoaRecord = (record, {hostname, isSlack}) => {
  const output = [`**${hostname}**`];
  const block = {
    type: 'context',
    elements: [{type: 'mrkdwn', text: `*${hostname}*`}]
  };

  for (const [key, value] of Object.entries(record)) {
    if (isSlack) {
      block.elements.push({type: 'mrkdwn', text: `${key}: \`${value}\``});
    } else {
      output.push(`${key}: \`${value}\``);
    }
  }

  return isSlack ? [block] : [output.join(' ')];
};

/**
 * @description null
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params) {
  const {hostname, __slack_headers: clientHeaders} = params;
  const isSlack = () => clientHeaders['user-agent'].includes('Slackbot');

  let {type = 'A'} = params;
  type = type.toUpperCase();

  const result = [];
  const dns = require('dns');
  const {promisify} = require('util');

  try {
    switch (type) {
      case 'A': {
        const resolve4Async = promisify(dns.resolve4);
        const records = await resolve4Async(hostname, {ttl: true});
        result.push(...formatARecords(records, {hostname, isSlack: isSlack()}));
        break;
      }

      case 'AAAA': {
        const resolve6Async = promisify(dns.resolve6);
        const records = await resolve6Async(hostname, {ttl: true});
        result.push(
          ...formatAAAARecords(records, {hostname, isSlack: isSlack()})
        );
        break;
      }

      case 'TXT': {
        const resolveTXTAsync = promisify(dns.resolveTxt);
        const records = await resolveTXTAsync(hostname);
        result.push(
          ...formatTXTRecords(records, {hostname, isSlack: isSlack()})
        );
        break;
      }

      case 'MX': {
        const resolveMXAsync = promisify(dns.resolveMx);
        const records = await resolveMXAsync(hostname);
        result.push(
          ...formatMXRecords(records, {hostname, isSlack: isSlack()})
        );
        break;
      }

      case 'NS': {
        const resolveNSAsync = promisify(dns.resolveNs);
        const records = await resolveNSAsync(hostname);
        result.push(
          ...formatNSRecords(records, {hostname, isSlack: isSlack()})
        );
        break;
      }

      case 'SOA': {
        const resolveSoaAsync = promisify(dns.resolveSoa);
        const records = await resolveSoaAsync(hostname);
        result.push(
          ...formatSoaRecord(records, {hostname, isSlack: isSlack()})
        );
        break;
      }

      default: {
        result.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `\`${type}\` is not supported. Supported records are \`A\`, \`AAAA\`, \`TXT\`, \`MX\`, \`NS\` & \`SOA\`.`
            }
          ]
        });
        break;
      }
    }
  } catch (error) {
    if (error.code === 'ENODATA') {
      if (isSlack()) {
        result.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `No records of type *${type}* found for ${hostname}.`
            }
          ]
        });
      } else {
        result.push(`No records of type **${type}** found for ${hostname}`);
      }
    } else if (error.code === 'ENOTFOUND') {
      if (isSlack()) {
        result.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Domain ${hostname} not found.`
            }
          ]
        });
      } else {
        result.push(`Domain ${hostname} not found.`);
      }
    } else {
      if (isSlack()) {
        result.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*ERROR:* ${error.message}`
          }
        });
      } else {
        result.push(`**ERROR:** ${error.message}`);
      }
    }
  }

  return {
    response_type: 'in_channel', // eslint-disable-line camelcase
    [isSlack() ? 'blocks' : 'text']: isSlack() ? result : result.join('\n')
  };
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */

const main = async ({__secrets = {}, commandText, ...params}) => ({
  body: await _command(params, commandText, __secrets)
});
module.exports = main;
