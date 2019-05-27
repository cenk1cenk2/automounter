/*
 * File: /index.js
 * -------------------------
 * File Created: 20190518
 * Author: Cenk Kılıç (cenk@kilic.dev)
 * -------------------------
<<<<<<< HEAD:index.js
 * Last Modified: 20190521
=======
 * Last Modified: 20190527
>>>>>>> 1ac1a4c... Rebased:automounter.js
 * Modified By: Cenk Kılıç (cenk@kilic.dev>)
 * Changelog:----------------
 * Date          By      Ver      Comments
 * -----------   ----    ----     ---------------------------------------------------------
 * 20190518      CK      v1.00    Initial Version
 */

const os = require('os')
const underscore = require('underscore')
const database = require('./database/setup.json')
const databasetools = require('./modules/databasetools')
const networktools = require('./modules/networktools')
const mounttools = require('./modules/mounttools')

async function main () {
  // Print logo
  console.log('Automounter v1.00')
  console.log('-------------------------------------------')

  // Get IP addresses of connected networks
  var connectedNetworks = await networktools.getConnectedNetworks()

  // Match connected networks with the known networks
  if (connectedNetworks) {
    var knownNetworks = await networktools.getKnownNetworks(database, connectedNetworks)
  } else {
    connectedNetworks = false
  }

  // Sort known and connected networks by priority
  knownNetworks = underscore.sortBy(knownNetworks, 'priority')

  // Drive mount part per computer
  Object.keys(database.mounts).forEach(async (host) => {
    console.log(`${host} \t| Trying to mount drives on host.`)
    // Check if given mounts are avaliable in knownNetworks and determine the preffered networks of the mounts
    var prefferedNetworks = await networktools.getPrefferedNetworks(database, host, knownNetworks)

    // only get the network with the highest priorty and check if any network is avalaible else skip this mount
    if (prefferedNetworks.length > 0) {
      var useNetwork = prefferedNetworks[0]
      console.log(`${host} \t| Network "${useNetwork.name}" will be used with network address "${useNetwork.network}" and priority ${useNetwork.priority}.`)
      database.mounts[host].mounts.forEach(async (shareName) => {
        // Split share name and alias by colon if defined
        shareName = await databasetools.splitShareName(shareName)
        // Check if already mounted
        var alreadyMounted = await mounttools.getAlreadyMounted(database.client.mountDir, shareName.shareAlias)
        // Mount if not already mounted
        if (alreadyMounted !== true) {
          console.log(`${host} \t| Mount: ${shareName.shareName} with alias ${shareName.shareAlias}`)
          mounttools.mountDrive(database, host, useNetwork, shareName.shareName, shareName.shareAlias)
        } else {
<<<<<<< HEAD:index.js
          console.error(`${host} \t| Already mounted: ${shareName.shareName} with alias ${shareName.shareAlias}`)
=======
          console.error(chalk.yellow(`${pad(host, 20)} | ${pad('ALREADY MOUNT', 15)} | ${shareName.shareName} with alias ${shareName.shareAlias}`))
>>>>>>> 1ac1a4c... Rebased:automounter.js
        }
      })
    } else {
      console.error(`${host} \t| Not in same network. Checking if any shares are already mounted.`)
      // umount if not on compatible network
      database.mounts[host].mounts.forEach(async (shareName) => {
        // Split share name and alias by colon if defined
        shareName = await databasetools.splitShareName(shareName)
        var alreadyMounted = await mounttools.getAlreadyMounted(database.client.mountDir, shareName.shareAlias)
        // UNMount if not already mounted
        if (alreadyMounted === true) {
          console.log(`${host} \t| Unmount: ${shareName.shareName} with alias ${shareName.shareAlias}`)
          mounttools.unmountDrive(database, host, shareName.shareAlias)
        } else {
<<<<<<< HEAD:index.js
          console.error(`${host} \t| Unmounted already: ${shareName.shareName} with alias ${shareName.shareAlias}`)
=======
          console.error(chalk.yellow(`${pad(host, 20)} | ${pad('ALREADY UNMOUNT', 15)} | ${shareName.shareName} with alias ${shareName.shareAlias}`))
>>>>>>> 1ac1a4c... Rebased:automounter.js
        }
      })
    }
  })
}

// Check if the platform is compatible
if (os.platform() !== 'linux') {
  console.error('This script is only compatible with Linux64.')
  process.exit(2)
}

databasetools.initdatabase()

main()
