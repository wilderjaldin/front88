import React, { useRef, useEffect } from 'react';
import { CurvyPath, LinePath, SquarePath } from 'svg-dom-arrows';

/**
 * Disclaimer, excuse my rusty React, there might be a more trivial way, but I've tried to show how it's supposed to work
 * You can create an issue if you think this can be improved here: https://github.com/tarkant/svg-dom-arrows/issues
 */
export function ArrowDemo(props) {
  const start = useRef();
  const end = useRef();

  useEffect(() => {
    /**
     * In theory, the options have to be the same across any *Path constructor, eg;
     * for LinePath, CurvyPath and SquarePath, the same options apply. If in the future there is a new AwesomePath
     * that needs more options, it will be recommended to keep these base options overlapping and compatible so that
     * devs can easily reimplement their code with less refractoring.
     */
    const options = {
      start: {
        element: start.current,
        position: {
          top: 0.5,
          left: 1
        }
      },
      end: {
        element: end.current,
        position: {
          top: 0.5,
          left: 0
        }
      },
      style: 'stroke:white;stroke-width:4;fill:transparent',
      appendTo: document.body
    };
    /**
     * I am aware that this is not the most optimal way to do this, but keep in mind that the idea here is just
     * to show how for each constructor, the same options are working ;)
     */
    if (props.type === 'LinePath' || !props.type) {
      const linePath = new LinePath(options);
      linePath.render(); // This method is useful to trigger a re-render of your path if the dom changes or window resizes
      /**
       * The library does not give you intentionally a way to re-render automatically the path so you can do it by yourself.
       * The biggest perk is that it means it's not framework dependent, whatever you use to render your DOM will surely work with this.
       */
    } else if (props.type === 'CurvyPath') {
      new CurvyPath(options);
    } else if (props.type === 'SquarePath') {
      new SquarePath(options);
    }
  }, [props.type]);

  return (
    <div class="container">
      <div className="start" ref={start} />
      <div className="end" ref={end} />
      <span class="type">{props.type || 'LinePath'}</span>
    </div>
  );
}
