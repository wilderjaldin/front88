// app/lib/uppercaseField.js
//
// Fuerza mayúsculas en vivo (mientras se escribe) sobre un campo de texto
// registrado con react-hook-form, sin perder el resto del wiring de
// register() (ref, onBlur, name) — mismo criterio que ya usaba a mano
// handleUppercaseChange en purchase-reception/orders.js, acá reutilizable
// para no repetir el wrapper en cada formulario.
//
// Uso: reemplaza {...register(name, rules)} por {...registerUpper(register, name, rules)}
// en cualquier <input>/<textarea> de texto libre que deba guardarse en mayúsculas.
//
// NO usar en campos de email, contraseña, URL o cualquier otro valor cuya
// capitalización importa tal cual la escribe el usuario — ahí sigue yendo
// register(...) normal.
export function registerUpper(register, name, rules) {
  const field = register(name, rules);
  return {
    ...field,
    onChange: (e) => {
      e.target.value = e.target.value.toUpperCase();
      return field.onChange(e);
    },
  };
}
