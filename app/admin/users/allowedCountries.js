'use client'

import { useEffect, useState } from "react"
import axiosClient from "@/app/lib/axiosClient"
import Swal from 'sweetalert2'

export default function AllowedCountries({
  user,
  action_cancel
}) {

  const [countries, setCountries] = useState([])
  const [allowed, setAllowed] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {

    try {

      const res = await axiosClient.get(`/usuarios/paises-permitidos/${user.codUsuario}`)

      setCountries(res.data.countries)
      setAllowed(res.data.allowed ?? [])

    } catch (err) {
      console.error(err)
    }

    setLoading(false)

  }

  const addCountry = (codPais) => {
    if (!allowed.includes(codPais)) {
      setAllowed([...allowed, codPais])
    }
  }

  const removeCountry = (codPais) => {
    setAllowed(allowed.filter(p => p !== codPais))
  }

  const save = async () => {

  setSaving(true)

  try {

    await axiosClient.put(
      `/usuarios/paises-permitidos/${user.codUsuario}`,
      { countries: allowed }
    )

    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Países permitidos actualizados',
      showConfirmButton: false,
      timer: 2500,
    })

    action_cancel()

  } catch (error) {

    Swal.fire({
      position: 'top-end',
      icon: 'error',
      title: error?.response?.data?.message || 'Error al guardar los países',
      showConfirmButton: false,
      timer: 3500
    })

  }

  setSaving(false)

}

  if (loading) {
    return <div className="p-6 text-center">Cargando países...</div>
  }

  const availableCountries = countries
    .filter(c => !allowed.includes(c.codPais))
    .filter(c =>
      c.nomPais.toLowerCase().includes(search.toLowerCase())
    )

  const allowedCountries = countries.filter(c =>
    allowed.includes(c.codPais)
  )

  return (

    <div className="space-y-4">

      <div className="grid grid-cols-2 gap-4">

        {/* DISPONIBLES */}

        <div className="border rounded-lg p-3 flex flex-col">

          <h3 className="font-semibold mb-2 text-sm">
            Países disponibles
          </h3>

          <input
            type="text"
            placeholder="Buscar país..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2 px-3 py-2 border rounded-md text-sm"
          />

          <div className="overflow-auto max-h-[300px] space-y-1">

            {availableCountries.map((c) => (

              <div
                key={c.codPais}
                className="flex justify-between items-center px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
              >

                <span className="text-sm">
                  {c.nomPais}
                </span>

                <button
                  onClick={() => addCountry(c.codPais)}
                  className="text-blue-600 text-sm"
                >
                  →
                </button>

              </div>

            ))}

          </div>

        </div>


        {/* PERMITIDOS */}

        <div className="border rounded-lg p-3 flex flex-col">

          <h3 className="font-semibold mb-2 text-sm">
            Países permitidos
          </h3>

          <div className="overflow-auto max-h-[340px] space-y-1">

            {allowedCountries.map((c) => (

              <div
                key={c.codPais}
                className="flex justify-between items-center px-2 py-1 hover:bg-gray-100 rounded"
              >

                <button
                  onClick={() => removeCountry(c.codPais)}
                  className="text-red-600 text-sm"
                >
                  ←
                </button>

                <span className="text-sm">
                  {c.nomPais}
                </span>

                <img
                  className="h-10 w-10 rounded-md object-cover border border-gray-200 dark:border-gray-700"
                  src={
                    c?.codPais
                      ? `/assets/flags/${c.codPais.toLowerCase()}.svg`
                      : "/assets/flags/bo.svg"
                  }
                  alt={c?.codPais || "country"}
                />

              </div>

            ))}

          </div>

        </div>

      </div>


      {/* BOTONES */}

      <div className="flex justify-end gap-3 pt-2">

        <button
          onClick={action_cancel}
          className="px-4 py-2 rounded-lg border"
        >
          Cancelar
        </button>

        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary text-white flex items-center gap-2 disabled:opacity-50"
        >
          {saving && (
            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
          )}
          {saving ? 'Guardando...' : 'Guardar'}
        </button>

      </div>

    </div>

  )
}