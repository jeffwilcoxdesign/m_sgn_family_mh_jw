/**
 * @file Stores oll game variables and constants.
 * @copyright CrossInstall 2016
 * @author 62316e@gmail.com
 */

export default class Globals {
  constructor() {
    throw new Error('AbstractClassError');
  }
}

// Static constants
Globals.FONT_IS_LOADED = false;
Globals.VERBOSE = true; // Must have feature
Globals.WEB_ROOT = ad_webroot + '/' + ad_name;
Globals.LAST_INTERACTION_TIME = 0;
Globals.REPLAYS_NUMBER = null;
