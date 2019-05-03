import {
  forEach
} from 'min-dash';

import {
  append as svgAppend,
  attr as svgAttr,
  clone as svgClone,
  create as svgCreate,
  remove as svgRemove
} from 'tiny-svg';

import { query as domQuery } from 'min-dom';

var MARKER_TYPES = [
  'marker-start',
  'marker-mid',
  'marker-end'
];


/**
 * Adds support for previews of moving/resizing elements.
 */
export default function PreviewSupport(elementRegistry, eventBus, canvas, styles) {
  this._elementRegistry = elementRegistry;
  this._canvas = canvas;
  this._styles = styles;

  this._clonedMarkers = {};

  var self = this;

  eventBus.on('drag.cleanup', function() {
    forEach(self._clonedMarkers, function(clonedMarker) {
      svgRemove(clonedMarker);
    });

    self._clonedMarkers = {};
  });
}

PreviewSupport.$inject = [
  'elementRegistry',
  'eventBus',
  'canvas',
  'styles'
];


/**
 * Returns graphics of an element.
 *
 * @param {djs.model.Base} element
 *
 * @return {SVGElement}
 */
PreviewSupport.prototype.getGfx = function(element) {
  return this._elementRegistry.getGraphics(element);
};

/**
 * Adds a move preview of a given shape to a given svg group.
 *
 * @param {djs.model.Base} element
 * @param {SVGElement} group
 *
 * @return {SVGElement} dragger
 */
PreviewSupport.prototype.addDragger = function(shape, group) {
  var gfx = this.getGfx(shape);

  var dragger = svgClone(gfx);
  var bbox = gfx.getBoundingClientRect();

  this._cloneMarkers(dragger);

  svgAttr(dragger, this._styles.cls('djs-dragger', [], {
    x: bbox.top,
    y: bbox.left
  }));

  svgAppend(group, dragger);

  return dragger;
};

/**
 * Adds a resize preview of a given shape to a given svg group.
 *
 * @param {djs.model.Base} element
 * @param {SVGElement} group
 *
 * @return {SVGElement} frame
 */
PreviewSupport.prototype.addFrame = function(shape, group) {

  var frame = svgCreate('rect', {
    class: 'djs-resize-overlay',
    width:  shape.width,
    height: shape.height,
    x: shape.x,
    y: shape.y
  });

  svgAppend(group, frame);

  return frame;
};

/**
 * Clone all markers referenced by an element and its child elements.
 *
 * @param {SVGElement} gfx
 */
PreviewSupport.prototype._cloneMarkers = function(gfx) {
  var self = this;

  if (gfx.children) {

    forEach(gfx.children, function(child) {

      // recursively clone markers of child elements
      self._cloneMarkers(child);
    });

  }

  MARKER_TYPES.forEach(function(markerType) {
    if (gfx.style[ markerType ]) {
      var marker = getMarkerById(getIdFromUrl(gfx.style[ markerType ]), self._canvas.getContainer());

      self._cloneMarker(gfx, marker, markerType);
    }
  });
};

/**
 * Clone marker referenced by an element.
 *
 * @param {SVGElement} gfx
 * @param {SVGElement} marker
 * @param {string} markerType
 */
PreviewSupport.prototype._cloneMarker = function(gfx, marker, markerType) {
  var markerId = svgAttr(marker, 'id');

  var clonedMarker = this._clonedMarkers[ markerId ];

  if (!clonedMarker) {
    clonedMarker = svgClone(marker);

    var clonedMarkerId = markerId + '-clone';

    svgAttr(clonedMarker, {
      class: 'djs-dragger',
      id: clonedMarkerId
    });

    this._clonedMarkers[ markerId ] = clonedMarker;

    var defs = domQuery('defs', this._canvas._svg);

    if (!defs) {
      defs = svgCreate('defs');

      svgAppend(this._canvas._svg, defs);
    }

    svgAppend(defs, clonedMarker);
  }

  var url = 'url(#' + svgAttr(this._clonedMarkers[ markerId ], 'id') + ')';

  gfx.style[ markerType ] = url;
};

// helpers //////////

/**
 * Get a marker by ID.
 *
 * @param {string} id
 * @param {DOMElement|SVGElement} element
 *
 * @param {SVGElement}
 */
function getMarkerById(id, element) {
  return domQuery('marker#' + id, element || document);
}

/**
 * Get ID from URL.
 *
 * @param {string} url
 *
 * @returns {string}
 */
function getIdFromUrl(url) {
  return url.match(/url\("#(.*)"\)/)[1];
}