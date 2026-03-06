'use client'

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import IconDots from "@/components/icon/icon-dots"

export default function UserActionsMenu({
  user,
  currentUserId,
  editUser,
  toggleUserStatus,
  handleViewAs,
  handleCountries
}) {

  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, openLeft: true, openUp: false })

  const buttonRef = useRef(null)

  const MENU_WIDTH = 190
  const MENU_HEIGHT = 240

  const openMenu = (e) => {

    e.stopPropagation()

    const rect = buttonRef.current.getBoundingClientRect()

    let left = rect.right
    let openLeft = true

    let top = rect.bottom + 6
    let openUp = false

    // controlar izquierda / derecha
    if (rect.left < MENU_WIDTH) {
      left = rect.left
      openLeft = false
    }

    // controlar arriba / abajo
    if (window.innerHeight - rect.bottom < MENU_HEIGHT) {
      top = rect.top - 6
      openUp = true
    }

    setPosition({
      top,
      left,
      openLeft,
      openUp
    })

    setOpen(true)
  }

  useEffect(() => {

    if (!open) return

    const close = () => setOpen(false)

    document.addEventListener("click", close)
    window.addEventListener("scroll", close, true) // ← solución al menú flotando
    window.addEventListener("resize", close)

    return () => {
      document.removeEventListener("click", close)
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }

  }, [open])

  return (
    <div className="relative">

      <button
        ref={buttonRef}
        onClick={openMenu}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <IconDots></IconDots>
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            transform: `
              ${position.openLeft ? "translateX(-100%)" : "translateX(0)"}
              ${position.openUp ? " translateY(-100%)" : ""}
            `
          }}
          className="w-48 rounded-xl bg-white dark:bg-gray-800
          shadow-xl border border-gray-200 dark:border-gray-700
          py-1 z-[9999]"
        >

          {/* Editar */}
          <button
            onClick={() => {
              editUser(user)
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ✏️ Editar
          </button>

          {/* Activar / Inactivar */}
          <button
            disabled={user.codUsuario === currentUserId}
            onClick={() => {
              toggleUserStatus(user)
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
          >
            {user.codEstado === 'AC' ? '🚫 Inactivar' : '✅ Reactivar'}
          </button>

          {/* Permisos */}
          <Link
            href={`/admin/register/users/permissions/${user.codUsuario}`}
            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setOpen(false)}
          >
            🔐 Permisos
          </Link>

          {/* Países permitidos */}
          <button
            onClick={() => {
              handleCountries(user)
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            🌎 Países permitidos
          </button>

          {/* Ver como */}
          <button
            disabled={user.codUsuario === currentUserId}
            onClick={() => {
              handleViewAs(user)
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
          >
            👁 Ver como usuario
          </button>

        </div>
      )}

    </div>
  )
}