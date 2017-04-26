import Globals from './../kernel/globals';

/**
 * @file A set of utils functions to work with multi-resolution.
 * @copyright CrossInstall 2016
 * @author 62316e@gmail.com
 */

class LayoutUtils {
  constructor() {
    throw new Error('AbstractClassError');
  }

  static getDevicePixelRatio() {
    let ratio = 1;

    if (window.screen.systemXDPI !== undefined && window.screen.logicalXDPI !== undefined && window.screen.systemXDPI > window.screen.logicalXDPI)
      ratio = window.screen.systemXDPI / window.screen.logicalXDPI;
    else if (window.devicePixelRatio !== undefined)
      ratio = window.devicePixelRatio;

    return ratio * LayoutUtils.RENDER_RESOLUTION;
  }

  static getHeaderHeight() {
    return LayoutUtils.HEADER_ELEMENT.clientHeight * LayoutUtils.getDevicePixelRatio() * LayoutUtils.INVS;
  }

  static refreshViewDimmensions() {
    LayoutUtils.CONTAINER = document.getElementById(LayoutUtils.CONTAINER_NAME);
    LayoutUtils.HEADER_ELEMENT = document.getElementById('ad_header');

    LayoutUtils.VIEW_WIDTH = window.innerWidth * LayoutUtils.getDevicePixelRatio();
    LayoutUtils.VIEW_HEIGHT = window.innerHeight * LayoutUtils.getDevicePixelRatio();

    if (LayoutUtils.IS_LANDSCAPE) {
      LayoutUtils.BASE_WIDTH = LayoutUtils.DEFAULT_BASE_WIDTH;
      LayoutUtils.BASE_HEIGHT = LayoutUtils.DEFAULT_BASE_HEIGHT;
    } else {
      LayoutUtils.BASE_WIDTH = LayoutUtils.DEFAULT_BASE_HEIGHT;
      LayoutUtils.BASE_HEIGHT = LayoutUtils.DEFAULT_BASE_WIDTH;
    }

    let scaleX = LayoutUtils.VIEW_WIDTH / LayoutUtils.BASE_WIDTH;
    let scaleY = LayoutUtils.VIEW_HEIGHT / LayoutUtils.BASE_HEIGHT;

    LayoutUtils.S = Math.min(scaleX, scaleY);
    LayoutUtils.INVS = 1 / LayoutUtils.S;

    LayoutUtils.LEFT_OFFSET = -((LayoutUtils.VIEW_WIDTH / 2) - ((LayoutUtils.BASE_WIDTH / 2)) * LayoutUtils.S) * LayoutUtils.INVS;
    LayoutUtils.RIGHT_OFFSET = -LayoutUtils.LEFT_OFFSET + LayoutUtils.BASE_WIDTH;
    LayoutUtils.TOP_OFFSET = -((LayoutUtils.VIEW_HEIGHT / 2) - ((LayoutUtils.BASE_HEIGHT / 2)) * LayoutUtils.S) * LayoutUtils.INVS;
    LayoutUtils.BOTTOM_OFFSET = -LayoutUtils.TOP_OFFSET + LayoutUtils.BASE_HEIGHT;
    LayoutUtils.FULL_GAME_WIDTH = LayoutUtils.RIGHT_OFFSET - LayoutUtils.LEFT_OFFSET;
    LayoutUtils.FULL_GAME_HEIGHT = LayoutUtils.BOTTOM_OFFSET - LayoutUtils.TOP_OFFSET;

    LayoutUtils.ASPECT_RATIO = Math.round((LayoutUtils.VIEW_HEIGHT / LayoutUtils.VIEW_WIDTH) * 100) / 100; //TODO: check landscape

    //console.log('[' + LayoutUtils.MODULE_NAME + ']', 'orientation:', ad_orientation, 'view-size:', LayoutUtils.VIEW_SIZE, 'left-offset:', LayoutUtils.LEFT_OFFSET, 'right-offset:', LayoutUtils.RIGHT_OFFSET, 'top-offset:', LayoutUtils.TOP_OFFSET, 'bottom-offset:', LayoutUtils.BOTTOM_OFFSET, 'aspect:', LayoutUtils.ASPECT_RATIO);
    LayoutUtils.fixCanvasSize(true);
    LayoutUtils.__blockWrongOrientation();
  }

  static __blockWrongOrientation() {
    if (ad_state !== 'live')
      return;

    if (LayoutUtils.IS_LANDSCAPE && LayoutUtils.VIEW_HEIGHT > LayoutUtils.VIEW_WIDTH)
      document.getElementById('orientation').style.display = 'block';
    else if (LayoutUtils.IS_PORTRAIT && LayoutUtils.VIEW_WIDTH > LayoutUtils.VIEW_HEIGHT)
      document.getElementById('orientation').style.display = 'block';
    else
      document.getElementById('orientation').style.display = 'none';
  }

  static fixCanvasSize(r = true) {
    if (r) {
      setTimeout(function() {
        LayoutUtils.fixCanvasSize(false);
      }, 100);
      return;
    }

    window.scrollTo(0, 1);
  }

  static centerIntoView(object) {
    object.scale.set(LayoutUtils.S);
    object.x = (LayoutUtils.VIEW_WIDTH / 2) - ((LayoutUtils.BASE_WIDTH / 2) * LayoutUtils.S);
    object.y = (LayoutUtils.VIEW_HEIGHT / 2) - ((LayoutUtils.BASE_HEIGHT / 2) * LayoutUtils.S);
  }

  static fitIntoRect(sprite, bounds, fillRect, align, spriteBounds) {
    let wD = spriteBounds ? spriteBounds.width / sprite.scale.x : sprite.width / sprite.scale.x;
    let hD = spriteBounds ? spriteBounds.height / sprite.scale.y : sprite.height / sprite.scale.y;

    let wR = bounds.width;
    let hR = bounds.height;

    let sX = wR / wD;
    let sY = hR / hD;

    let rD = wD / hD;
    let rR = wR / hR;

    let sH = fillRect ? sY : sX;
    let sV = fillRect ? sX : sY;

    let s = rD >= rR ? sH : sV;
    let w = wD * s;
    let h = hD * s;

    let tX = 0.0;
    let tY = 0.0;

    switch (align) {
      case 'left':
      case 'topLeft':
      case 'bottomLeft':
        tX = 0.0;
        break;

      case 'right':
      case 'topRight':
      case 'bottomRight':
        tX = w - wR;
        break;

      default:
        tX = 0.5 * (w - wR);
    }

    switch (align) {
      case 'top':
      case 'topLeft':
      case 'topRight':
        tY = 0.0;
        break;

      case 'bottom':
      case 'bottomLeft':
      case 'bottomRight':
        tY = h - hR;
        break;

      default:
        tY = 0.5 * (h - hR);
    }

    sprite.x = bounds.x - tX;
    sprite.y = bounds.y - tY;
    sprite.scale.set(s);
  }
}

// Hum hum! 1 = 1:1 to device size. 0.5 means 50% to device pixel density. Make it smaller only if you need to get few more FPS.
LayoutUtils.RENDER_RESOLUTION = 1;

// MR related
LayoutUtils.CONTAINER_NAME = 'creative';
LayoutUtils.CONTAINER = document.getElementById(LayoutUtils.CONTAINER_NAME);

LayoutUtils.DEFAULT_BASE_WIDTH = 960;
LayoutUtils.DEFAULT_BASE_HEIGHT = 640;

LayoutUtils.BASE_WIDTH = 960;
LayoutUtils.BASE_HEIGHT = 640;

LayoutUtils.ASPECT_RATIO = 0;
LayoutUtils.S = 1; // SCALE
LayoutUtils.INVS = 1 / LayoutUtils.S; // SCALE INVERTED
LayoutUtils.VIEW_WIDTH = 0;
LayoutUtils.VIEW_HEIGHT = 0;

LayoutUtils.LEFT_OFFSET = 0;
LayoutUtils.RIGHT_OFFSET = 0;
LayoutUtils.TOP_OFFSET = 0;
LayoutUtils.BOTTOM_OFFSET = 0;

LayoutUtils.IS_LANDSCAPE = (ad_orientation === 'landscape');
LayoutUtils.IS_PORTRAIT = !LayoutUtils.IS_LANDSCAPE;

// Fake
LayoutUtils.MODULE_NAME = 'LayoutUtils';
export default LayoutUtils;
