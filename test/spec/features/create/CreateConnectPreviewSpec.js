import {
  bootstrapDiagram,
  inject
} from 'test/TestHelper';

import {
  createCanvasEvent as canvasEvent
} from '../../../util/MockEvents';

import modelingModule from 'lib/features/modeling';
import moveModule from 'lib/features/move';
import dragModule from 'lib/features/dragging';
import createModule from 'lib/features/create';
import attachSupportModule from 'lib/features/attach-support';
import rulesModule from './rules';

import {
  classes as svgClasses
} from 'tiny-svg';


describe('features/create - CreateConnectPreview', function() {

  beforeEach(bootstrapDiagram({
    modules: [
      createModule,
      rulesModule,
      attachSupportModule,
      modelingModule,
      moveModule,
      dragModule
    ]
  }));

  beforeEach(inject(function(dragging) {
    dragging.setOptions({ manual: true });
  }));

  var rootShape,
      parentShape,
      childShape,
      newShape;

  beforeEach(inject(function(elementFactory, canvas) {

    rootShape = elementFactory.createRoot({
      id: 'root'
    });

    canvas.setRootElement(rootShape);

    parentShape = elementFactory.createShape({
      id: 'parent',
      x: 100, y: 100, width: 200, height: 200
    });

    canvas.addShape(parentShape, rootShape);


    childShape = elementFactory.createShape({
      id: 'childShape',
      x: 150, y: 350, width: 100, height: 100
    });

    canvas.addShape(childShape, rootShape);


    newShape = elementFactory.createShape({
      id: 'newShape',
      x: 0, y: 0, width: 50, height: 50
    });
  }));


  describe('display', function() {

    it('should display connection preview', inject(function(create, elementRegistry, dragging) {

      // given
      var parentGfx = elementRegistry.getGraphics('parentShape');

      // when
      create.start(canvasEvent({ x: 0, y: 0 }), newShape, childShape);

      dragging.move(canvasEvent({ x: 175, y: 175 }));
      dragging.hover({ element: parentShape, gfx: parentGfx });
      dragging.move(canvasEvent({ x: 400, y: 200 }));

      var ctx = dragging.context();

      // then
      expect(ctx.data.context.connectVisual).to.exist;
      expect(svgClasses(ctx.data.context.connectVisual).has('djs-dragger')).to.be.true;
    }));
  });

  describe('cleanup', function() {

    it('should remove connection preview on dragging end', inject(function(create, elementRegistry, dragging) {

      // given
      var parentGfx = elementRegistry.getGraphics('parentShape');

      // when
      create.start(canvasEvent({ x: 0, y: 0 }), newShape, childShape);

      dragging.move(canvasEvent({ x: 175, y: 175 }));
      dragging.hover({ element: parentShape, gfx: parentGfx });
      dragging.move(canvasEvent({ x: 400, y: 200 }));

      var ctx = dragging.context();

      dragging.end();

      // then
      expect(ctx.data.context.connectVisual.parentNode).not.to.exist;
    }));


    it('should remove connection preview on dragging cancel', inject(function(create, elementRegistry, dragging) {

      // given
      var parentGfx = elementRegistry.getGraphics('parentShape');

      // when
      create.start(canvasEvent({ x: 0, y: 0 }), newShape, childShape);

      dragging.move(canvasEvent({ x: 175, y: 175 }));
      dragging.hover({ element: parentShape, gfx: parentGfx });
      dragging.move(canvasEvent({ x: 400, y: 200 }));

      var ctx = dragging.context();

      dragging.cancel();

      // then
      expect(ctx.data.context.connectVisual.parentNode).not.to.exist;
    }));
  });


  describe('rules', function() {

    it('should not display preview if connection is disallowed',
      inject(function(create, elementRegistry, dragging, createRules) {

        // given
        createRules.addRule('connection.create', 8000, function() {
          return false;
        });

        var parentGfx = elementRegistry.getGraphics('parentShape');

        // when
        create.start(canvasEvent({ x: 0, y: 0 }), newShape, childShape);

        dragging.move(canvasEvent({ x: 175, y: 175 }));
        dragging.hover({ element: parentShape, gfx: parentGfx });
        dragging.move(canvasEvent({ x: 400, y: 200 }));

        var ctx = dragging.context();

        // then
        expect(ctx.data.context.connectVisual.childNodes).to.be.have.lengthOf(0);
      })
    );

  });
});
