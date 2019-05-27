```
name:         | automounter
compiler:     | nodejs
version:      | v1.10, 20190527
```

# Automounter

## Description:

This script will compare your connected and defined networks in the text-based database and will connect to the given share with the network of lowest priorty. 

The use case scenerio of this is when you have a mobile workstation like a laptop and not every network is avaliable to the device every given time. Shares can be defined in multiple networks therefor while you can connect to all of them via a common network like a VPN network, you can prioritize a real network like home or work network above it so it will connect directly instead of trying to reach from a VPN network.

Since SMB4k unfortunately not working as intended on my system, I made this crude implementation to suffice.

## Setup

In initial run it will generate the database while ./automounter-db.json file which needs to be edited with the parameters.

## Dependencies

* For now only Linux platform is supported.
* nmblookup therefor samba-common has to be configured, since this is a crude implementation it uses nmblookup to lookup the WINS name of the device in network