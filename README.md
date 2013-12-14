![logo](https://raw.github.com/slikts/wtmap/master/images/icon-128.png)

WT map
=======

WT map is a Chrome extension that enhances the browser-based map in 
[War Thunder](http://warthunder.com/). It can be used with multi-monitor
setups or on a different device from the one running the game. The purpose
of the map is to help improve situational awareness.

Features
--------

![screenshot](https://raw.github.com/slikts/wtmap/master/images/screenshot.png)

New:

 * Different plane icons for fighters, bombers and attackers
 * Plane icons show plane orientation
 * Proximity alert that plays a sound when the number of nearby enemies increases
 * Configurable options:
   * Proximity alert radius and volume
   * Plane icon size
 * Info in page title:
   * Number of enemies within proximity radius
   * The distance to the closest enemy
   * The total number of allied planes
 * Ground units never obscure plane icons

Planned:

 * Map centering on player
 * Configurable sound for proximity alert
 * Firefox version (?)

Installation
------------

The extension can be installed from its [Chrome Web Store page](https://chrome.google.com/webstore/detail/gmhaddmfnmddbjgobfjfghpjlbgmeiop).

Usage
-----

The enhanced map can be opened from the extension options page. It's recommended 
to bookmark the map page for easy access. War Thunder needs to be running 
for the map to work.

To use the map on a different device from the one running the game,
the correct map location should be set in the options. For instance,
if the local IP address of the PC running the game was 192.168.1.1,
the map location would be http://192.168.1.1:8111/. The game process (aces.exe) 
may need to be allowed through the firewall. If one of the devices is wireless
and the other wired, the local network needs to be configured to allow 
them to connect.

Notes
-----

The features added by this extension don't depend on Chrome-specific
functionality and should be easily portable to other platforms.

The extension only has permission to access http://localhost:8111/ by default
and the permissions to access other map locations are requested on the fly
if needed and removed if not used.

The extension works by monkey-patching the code used in the original map.
It doesn't modify the map in-place but recreates it in a special page
because the Chrome content scripts can only access page DOM and not their
JavaScript environment.

The idea of making this extension comes from the
[War Thunder tactical map](https://play.google.com/store/apps/details?id=net.junkcode.warthundertacticalmap)
Android app.

The icon for the fighter planes is a Spitfire, IL-2 for the attackers 
and He 88 for the bombers.

Licence
-------

The project is available under the MIT licence.
