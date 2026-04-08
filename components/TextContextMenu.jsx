'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function TextContextMenu() {
  const [selectedText, setSelectedText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleContextMenu = (e) => {
      const text = window.getSelection().toString().trim();
      if (text) {
        e.preventDefault();
        setSelectedText(text);
        setMousePos({ x: e.clientX, y: e.clientY });
        setShowModal(true);
      } else {
        setShowModal(false);
      }
    };

    const handleClick = () => setShowModal(false);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  if (typeof window === 'undefined') return null;

  return createPortal(
    showModal && (
      <div
        className="fixed top-0 left-0 w-full h-full z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        <div
          className="absolute bg-white rounded-xl shadow-lg p-4 min-w-[200px]"
          style={{ top: mousePos.y + 10, left: mousePos.x + 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-semibold mb-2 text-gray-800 text-sm">Texto seleccionado:</h3>
          <p className="text-gray-600 text-xs italic mb-3">{selectedText}</p>

          <div className="flex flex-col gap-2">
            <button
              className="text-left text-sm hover:bg-gray-100 p-1 rounded"
              onClick={() => {
                navigator.clipboard.writeText(selectedText);
                setShowModal(false);
              }}
            >
              📋 Copiar
            </button>

            <button
              className="text-left text-sm hover:bg-gray-100 p-1 rounded"
              onClick={() => {
                alert(`Traducir: ${selectedText}`);
                setShowModal(false);
              }}
            >
              🌐 Traducir
            </button>

            <button
              className="text-left text-sm hover:bg-gray-100 p-1 rounded"
              onClick={() => {
                alert(`Marcar texto: ${selectedText}`);
                setShowModal(false);
              }}
            >
              🔖 Marcar
            </button>
          </div>
        </div>
      </div>
    ),
    document.body
  );
}