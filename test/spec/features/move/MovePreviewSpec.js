import {
  bootstrapDiagram,
  inject
} from 'test/TestHelper';

import {
  createCanvasEvent as canvasEvent
} from '../../../util/MockEvents';

import modelingModule from 'lib/features/modeling';
import moveModule from 'lib/features/move';
import attachSupportModule from 'lib/features/attach-support';
import rulesModule from './rules';
import rendererModule from './renderer';

import {
  query as domQuery,
  queryAll as domQueryAll
} from 'min-dom';

import {
  attr as svgAttr,
  classes as svgClasses
} from 'tiny-svg';


describe('features/move - MovePreview', function() {

  describe('general', function() {

    beforeEach(bootstrapDiagram({
      modules: [
        attachSupportModule,
        modelingModule,
        moveModule,
        rulesModule
      ]
    }));

    beforeEach(inject(function(dragging) {
      dragging.setOptions({ manual: true });
    }));


    var rootShape, parentShape, childShape, childShape2, connection;

    beforeEach(inject(function(elementFactory, canvas) {

      rootShape = elementFactory.createRoot({
        id: 'root'
      });

      canvas.setRootElement(rootShape);

      parentShape = elementFactory.createShape({
        id: 'parent',
        x: 100, y: 100, width: 300, height: 300
      });

      canvas.addShape(parentShape, rootShape);

      childShape = elementFactory.createShape({
        id: 'child',
        x: 110, y: 110, width: 100, height: 100
      });

      canvas.addShape(childShape, parentShape);

      childShape2 = elementFactory.createShape({
        id: 'child2',
        x: 200, y: 110, width: 100, height: 100
      });

      canvas.addShape(childShape2, parentShape);

      connection = elementFactory.createConnection({
        id: 'connection',
        waypoints: [ { x: 150, y: 150 }, { x: 150, y: 200 }, { x: 350, y: 150 } ],
        source: childShape,
        target: childShape2
      });

      canvas.addConnection(connection, parentShape);
    }));


    describe('style integration via <djs-dragging>', function() {

      it('should append class to shape + outgoing connections', inject(function(move, dragging, elementRegistry) {

        // given
        move.start(canvasEvent({ x: 10, y: 10 }), childShape);

        // when
        dragging.move(canvasEvent({ x: 20, y: 20 }));

        // then
        expect(svgClasses(elementRegistry.getGraphics(childShape)).has('djs-dragging')).to.equal(true);
        expect(svgClasses(elementRegistry.getGraphics(connection)).has('djs-dragging')).to.equal(true);
      }));


      it('should append class to shape + incoming connections', inject(function(move, dragging, elementRegistry) {

        // given
        move.start(canvasEvent({ x: 10, y: 10 }), childShape2);

        // when
        dragging.move(canvasEvent({ x: 20, y: 20 }));

        // then
        expect(svgClasses(elementRegistry.getGraphics(childShape2)).has('djs-dragging')).to.equal(true);
        expect(svgClasses(elementRegistry.getGraphics(connection)).has('djs-dragging')).to.equal(true);
      }));


      it('should remove class on drag end', inject(function(move, dragging, elementRegistry) {

        // given
        move.start(canvasEvent({ x: 10, y: 10 }), childShape2);

        // when
        dragging.move(canvasEvent({ x: 30, y: 30 }));
        dragging.end();

        // then
        expect(svgClasses(elementRegistry.getGraphics(childShape2)).has('djs-dragging')).to.equal(false);
        expect(svgClasses(elementRegistry.getGraphics(connection)).has('djs-dragging')).to.equal(false);
      }));

    });


    describe('drop markup', function() {

      it('should indicate drop allowed', inject(function(move, dragging, elementRegistry) {

        // given
        move.start(canvasEvent({ x: 10, y: 10 }), childShape);

        // when
        dragging.move(canvasEvent({ x: 20, y: 20 }));
        dragging.hover(canvasEvent({ x: 20, y: 20 }, {
          element: parentShape,
          gfx: elementRegistry.getGraphics(parentShape)
        }));

        dragging.move(canvasEvent({ x: 22, y: 22 }));

        // then
        var ctx = dragging.context();
        expect(ctx.data.context.canExecute).to.equal(true);

        expect(svgClasses(elementRegistry.getGraphics(parentShape)).has('drop-ok')).to.equal(true);
      }));


      it('should indicate drop not allowed', inject(function(move, dragging, elementRegistry) {

        // given
        move.start(canvasEvent({ x: 10, y: 10 }), childShape);

        // when
        dragging.move(canvasEvent({ x: 20, y: 20 }));
        dragging.hover(canvasEvent({ x: 20, y: 20 }, {
          element: childShape,
          gfx: elementRegistry.getGraphics(childShape)
        }));

        dragging.move(canvasEvent({ x: 22, y: 22 }));

        // then
        var ctx = dragging.context();
        expect(ctx.data.context.canExecute).to.equal(false);

        expect(svgClasses(elementRegistry.getGraphics(childShape)).has('drop-not-ok')).to.equal(true);
      }));

    });


    describe('drop markup on target change', function() {

      var differentShape;

      beforeEach(inject(function(elementFactory, canvas) {

        differentShape = elementFactory.createShape({
          id: 'differentShape',
          x: 10, y: 110, width: 50, height: 50
        });

        canvas.addShape(differentShape, rootShape);

      }));


      it('should indicate new target, if selected shapes have different parents',
        inject(function(move, dragging, elementRegistry, selection) {

          // given
          selection.select([ childShape, differentShape ]);

          move.start(canvasEvent({ x: 10, y: 10 }), differentShape);

          // when
          dragging.move(canvasEvent({ x: 200, y: 200 }));
          dragging.hover(canvasEvent({ x: 200, y: 200 }, {
            element: parentShape,
            gfx: elementRegistry.getGraphics(parentShape)
          }));

          dragging.move(canvasEvent({ x: 120, y: 180 }));

          // then
          var ctx = dragging.context();
          expect(ctx.data.context.differentParents).to.equal(true);

          expect(svgClasses(elementRegistry.getGraphics(parentShape)).has('new-parent')).to.equal(true);
        })
      );


      it('should not indicate new target, if target does not change',
        inject(function(move, dragging, elementRegistry, selection) {

          // given
          selection.select([ childShape, differentShape ]);

          move.start(canvasEvent({ x: 10, y: 10 }), childShape);

          // when
          dragging.move(canvasEvent({ x: 200, y: 200 }));
          dragging.hover(canvasEvent({ x: 200, y: 200 }, {
            element: parentShape,
            gfx: elementRegistry.getGraphics(parentShape)
          }));

          dragging.move(canvasEvent({ x: 120, y: 180 }));

          // then
          var ctx = dragging.context();
          expect(ctx.data.context.differentParents).to.equal(true);

          expect(svgClasses(elementRegistry.getGraphics(parentShape)).has('drop-new-target')).to.equal(false);
        })
      );


      it('should not indicate new target, if drop is not allowed',
        inject(function(move, dragging, elementRegistry, selection) {

          // given
          selection.select([ childShape, differentShape ]);

          move.start(canvasEvent({ x: 10, y: 10 }), differentShape);

          // when
          dragging.move(canvasEvent({ x: 200, y: 200 }));
          dragging.hover(canvasEvent({ x: 200, y: 200 }, {
            element: childShape,
            gfx: elementRegistry.getGraphics(childShape)
          }));

          dragging.move(canvasEvent({ x: 150, y: 15 }));

          // then
          var ctx = dragging.context();
          expect(ctx.data.context.differentParents).to.equal(true);

          var childGfx = elementRegistry.getGraphics(childShape);
          expect(svgClasses(childGfx).has('drop-new-target')).to.equal(false);
          expect(svgClasses(childGfx).has('drop-not-ok')).to.equal(true);
        })
      );

    });


    describe('frame elements', function() {

      var frameShape;

      beforeEach(inject(function(elementFactory, canvas) {

        frameShape = elementFactory.createShape({
          id: 'frameShape',
          x: 450, y: 50, width: 400, height: 200,
          isFrame: true
        });

        canvas.addShape(frameShape, rootShape);
      }));


      it('should indicate drop not allowed', inject(function(move, dragging, elementRegistry) {

        // given
        move.start(canvasEvent({ x: 10, y: 10 }), childShape);

        var targetGfx = elementRegistry.getGraphics(frameShape);

        // when
        dragging.move(canvasEvent({ x: 300, y: 20 }));
        dragging.hover(canvasEvent({ x: 300, y: 20 }, {
          element: frameShape,
          gfx: elementRegistry.getGraphics(childShape)
        }));

        dragging.move(canvasEvent({ x: 300, y: 22 }));

        // then
        var ctx = dragging.context();
        expect(ctx.data.context.canExecute).to.equal(false);

        expect(svgClasses(targetGfx).has('djs-frame')).to.equal(true);
        expect(svgClasses(targetGfx).has('drop-not-ok')).to.equal(true);
      }));

    });


    describe('connections', function() {

      var host, attacher, parentShape2, shape, connectionA, connectionB;

      beforeEach(inject(function(elementFactory, canvas, modeling) {

        parentShape2 = elementFactory.createShape({
          id: 'parentShape2',
          x: 450, y: 50, width: 400, height: 200
        });

        canvas.addShape(parentShape2, rootShape);

        host = elementFactory.createShape({
          id: 'host',
          x: 500, y: 100, width: 100, height: 100
        });

        canvas.addShape(host, parentShape2);

        attacher = elementFactory.createShape({
          id: 'attacher',
          x: 0, y: 0, width: 50, height: 50
        });

        modeling.createShape(attacher, { x: 600, y: 100 }, host, true);

        shape = elementFactory.createShape({
          id: 'shape',
          x: 700, y: 100, width: 100, height: 100
        });

        canvas.addShape(shape, parentShape2);

        connectionA = elementFactory.createConnection({
          id: 'connectionA',
          waypoints: [ { x: 500, y: 100 }, { x: 750, y: 150 } ],
          source: host,
          target: shape
        });

        canvas.addConnection(connectionA, parentShape2);

        connectionB = elementFactory.createConnection({
          id: 'connectionB',
          waypoints: [ { x: 600, y: 100 }, { x: 750, y: 150 } ],
          source: attacher,
          target: shape
        });

        canvas.addConnection(connectionB, parentShape2);
      }));


      it('should add connections to dragGroup',
        inject(function(move, dragging, elementRegistry, selection) {

          var rootGfx = elementRegistry.getGraphics(rootShape),
              dragGroup;

          // when
          selection.select([ host, shape ]);


          move.start(canvasEvent({ x: 0, y: 0 }), host);

          dragging.hover({
            element: rootShape,
            gfx: rootGfx
          });

          dragging.move(canvasEvent({ x: 150, y: 200 }));

          dragGroup = dragging.context().data.context.dragGroup;

          // then
          expect(domQuery('[data-element-id="connectionA"]', dragGroup)).to.exist;
          expect(domQuery('[data-element-id="connectionB"]', dragGroup)).to.exist;
        })
      );

    });

  });


  describe('markers', function() {

    beforeEach(bootstrapDiagram({
      modules: [
        attachSupportModule,
        modelingModule,
        moveModule,
        rendererModule,
        rulesModule
      ]
    }));

    beforeEach(inject(function(dragging) {
      dragging.setOptions({ manual: true });
    }));


    var rootShape, shape1, shape2, shape3, connection1, connection2, connection3;

    beforeEach(inject(function(elementFactory, canvas) {

      rootShape = elementFactory.createRoot({
        id: 'root'
      });

      canvas.setRootElement(rootShape);

      shape1 = elementFactory.createShape({
        id: 'shape1',
        x: 100, y: 100, width: 100, height: 100
      });

      canvas.addShape(shape1, rootShape);

      shape2 = elementFactory.createShape({
        id: 'shape2',
        x: 400, y: 300, width: 100, height: 100
      });

      canvas.addShape(shape2, rootShape);

      shape3 = elementFactory.createShape({
        id: 'shape3',
        x: 100, y: 300, width: 100, height: 100
      });

      canvas.addShape(shape3, rootShape);

      connection1 = elementFactory.createConnection({
        id: 'connection1',
        waypoints: [ { x: 200, y: 150 }, { x: 450, y: 150 }, { x: 450, y: 300 } ],
        source: shape1,
        target: shape2,
        markerStart: true,
        markerEnd: true
      });

      canvas.addConnection(connection1, rootShape);

      connection2 = elementFactory.createConnection({
        id: 'connection2',
        waypoints: [ { x: 450, y: 400 }, { x: 450, y: 450 }, { x: 150, y: 450 }, { x: 150, y: 400 } ],
        source: shape1,
        target: shape2,
        markerStart: true,
        markerMid: true
      });

      canvas.addConnection(connection2, rootShape);

      connection3 = elementFactory.createConnection({
        id: 'connection3',
        waypoints: [ { x: 150, y: 300 }, { x: 150, y: 200 } ],
        source: shape1,
        target: shape2,
        markerMid: true,
        markerEnd: true
      });

      canvas.addConnection(connection3, rootShape);
    }));


    it('should clone markers', inject(function(canvas, dragging, move, selection) {

      // when
      selection.select([ shape1, shape2, shape3 ]);

      move.start(canvasEvent({ x: 0, y: 0 }), shape2);

      dragging.move(canvasEvent({ x: 100, y: 50 }));

      var dragGroup = dragging.context().data.context.dragGroup;

      // then
      var clonedMarkers = getMarkers(canvas._svg, function(marker) {
        return /-clone$/.test(svgAttr(marker, 'id'));
      });

      expect(clonedMarkers).to.have.length(3);

      var markerStartClone = getMarkerById('marker-start-clone'),
          markerMidClone = getMarkerById('marker-mid-clone'),
          markerEndClone = getMarkerById('marker-end-clone');

      expect(markerStartClone).to.exist;
      expect(markerMidClone).to.exist;
      expect(markerEndClone).to.exist;

      var connection1Polyline = domQuery('[data-element-id="connection1"] polyline', dragGroup);

      expect(connection1Polyline.style.markerStart).to.eql(getMarkerUrl(markerStartClone));
      expect(connection1Polyline.style.markerEnd).to.eql(getMarkerUrl(markerEndClone));

      var connection2Polyline = domQuery('[data-element-id="connection2"] polyline', dragGroup);

      expect(connection2Polyline.style.markerStart).to.eql(getMarkerUrl(markerStartClone));
      expect(connection2Polyline.style.markerMid).to.eql(getMarkerUrl(markerMidClone));

      var connection3Polyline = domQuery('[data-element-id="connection3"] polyline', dragGroup);

      expect(connection3Polyline.style.markerMid).to.eql(getMarkerUrl(markerMidClone));
      expect(connection3Polyline.style.markerEnd).to.eql(getMarkerUrl(markerEndClone));
    }));


    it('should remove markers on cleanup', inject(function(canvas, dragging, move, selection) {

      // when
      selection.select([ shape1, shape2, shape3 ]);

      move.start(canvasEvent({ x: 0, y: 0 }), shape2);

      dragging.move(canvasEvent({ x: 100, y: 50 }));

      dragging.end();

      // then
      var clonedMarkers = getMarkers(canvas._svg, function(marker) {
        return /-clone$/.test(svgAttr(marker, 'id'));
      });

      expect(clonedMarkers).to.have.length(0);
    }));

  });

});

// helpers //////////

/**
 * Get markers with optional filter.
 *
 * @param {SVGElement} svg
 * @param {Function} [filter]
 *
 * @param {Array<SVGElement>}
 */
function getMarkers(svg, filter) {
  var markers = domQueryAll('marker', svg);

  return Array.prototype.slice.call(markers).filter(filter || function() {});
}

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
 * Get URL by which a marker is referenced.
 *
 * @param {SVGElement} marker
 *
 * @returns {string}
 */
function getMarkerUrl(marker) {
  return 'url("#' + svgAttr(marker, 'id') + '")';
}