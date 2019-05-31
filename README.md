```
name:         | automounter
compiler:     | nodejs
version:      | v1.20, 20190601
```

# Automounter

## Description:

This script will compare your connected and defined networks in the text-based database and will connect to the given share with the network of lowest priorty. 

The use case scenerio of this is when you have a mobile workstation like a laptop and not every network is avaliable to the device every given time. Shares can be defined in multiple networks therefor while you can connect to all of them via a common network like a VPN network, you can prioritize a real network like home or work network above it so it will connect directly instead of trying to reach from a VPN network.

Since SMB4k unfortunately not working as intended on my system, I made this crude implementation with this little twist to suffice.

## Dependencies and Prerequisites

* For now only Linux platform is supported and complied. It will propably work in MacOS as well since the shared commands but not tested therefor not compiled.
* nmblookup therefor samba-common has to be configured, since this is a crude implementation it uses nmblookup to lookup the WINS name of the device in network. But if nmblookup is not configured it will fallback to the fallback ips defined in the database.

## Compiled Version
You can find the compiled version in the [releases](https://github.com/cenk1cenk2/automounter/releases/latest).

## Command Line Options
```
-------------------------------------------
Usage: automounter \[options\] \[flags\]

Options:
  -r, --repeat        Override the default repeat time in the database.
  -o, --once          Script will run once instead of the default option of
                      repeating.                                       \[boolean\]
  -c, --config        Override the default database location.
  -u, --unmount       Force unmount all the defined drives in database. Script
                      will terminate after.                            \[boolean\]
  -p, --path-unmount  Force unmount all the folders recursively in the mount
                      path. Script will terminate after.
                      Depth must be supplied to tell how many folders to
                      recurse. Default is 1.
  -a, --ask           Asks the user for prompt before taking action.   \[boolean\]
  -h, --help          Show help                                        \[boolean\]
  -v, --version       Show version number                              \[boolean\]
```

## Setup

In initial run it will generate the database while ./automounter-db.json file which needs to be edited with the parameters.

### Configuration of Database

You can easily setup the generated as below. Unfortunetly passwords are kept in unencrypted files havening to the initial purpose of the script. 

```
{
  "client": {
    "repeat": 60, (in Seconds)
    "mountDir": "/mnt", (Absolute path to Mount Directory)
    "mountOptions": "vers=3,uid=0,gid=0,iocharset=utf8,file_mode=0775,dir_mode=0775,cache=none" (Options for SAMBA)
  },
  "networks": {
    "home": {
      "network": "192.168.1.*", (As in the form of X.X.X the rest is not important)
      "priority": 10 (Lower the number higher the priority)
    }
    "vpn": {
      "network": "10.10.150.*",
      "priority": 50
    }
  },
  "mounts": {
    "PC01": (it will look up for this name in the nmblookup, so this has to be advertised samba name) {
      "enabled": true (for easily switching depending on the situatation)
      "mounts": ["SHARE01@PC01/DATA_1", "SHARE02@PC01/DATA_2"], (first part must match the samba share name; if you want to create ALIAS for the share given use @ALIAS after. you can also mount it in subfolders if you use the hiearchy using unix folder structure)
      "available": ["home@.6", "vpn"], (match the exact name in networks section; if you want to create a fallback IP in case of nmblookup fails, @IP or @.IP in /24 netmask will be sufficient)
      "user": "superusername",
      "password": "superpassword"
    }
  }
}
```
