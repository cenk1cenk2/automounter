# Example for Database

You can easily setup the generated as below.

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
      "mounts": ["SHARE01@PC01/DATA_1", "SHARE02@PC01/DATA_2"], ( first part must match the samba share name; if you want to create ALIAS for the share given use @ALIAS after. you can also mount it in subfolders if you use the hiearchy using unix folder structure )
      "available": ["home@.6", "vpn"], (match the exact name in networks section; if you want to create a fallback IP in case of nmblookup fails, @IP or @.IP in /24 netmask will be sufficient)
      "user": "superusername",
      "password": "superpassword"
    }
  }
}
