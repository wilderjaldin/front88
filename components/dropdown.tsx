'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';

const Dropdown = (props: any, forwardedRef: any) => {
    const [visibility, setVisibility] = useState(false);

    const {
        refs,
        floatingStyles,
        placement,
    } = useFloating({
        placement: props.placement || 'bottom-end',
        middleware: [
            offset(props.offset ? props.offset[1] || 8 : 8),
            flip(),
            shift(),
        ],
        whileElementsMounted: autoUpdate,
    });

    const handleDocumentClick = (event: any) => {
        if (
            refs.reference.current?.contains(event.target) ||
            refs.floating.current?.contains(event.target)
        ) {
            return;
        }
        setVisibility(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, []);

    useImperativeHandle(forwardedRef, () => ({
        close() {
            setVisibility(false);
        },
    }));

    return (
        <>
            <button
                ref={refs.setReference}
                type="button"
                className={props.btnClassName}
                onClick={() => setVisibility(!visibility)}
            >
                {props.button}
            </button>

            {visibility && (
                <div
                    ref={refs.setFloating}
                    style={floatingStyles}
                    className="z-50"
                    onClick={() => setVisibility(!visibility)}
                >
                    {props.children}
                </div>
            )}
        </>
    );
};

export default forwardRef(Dropdown);