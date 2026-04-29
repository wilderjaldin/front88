'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from "react-hook-form"
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import IconHelpCircle from '../icon/icon-help-circle';
import IconTrashLines from '../icon/icon-trash-lines';
import axiosClient from '@/app/lib/axiosClient';

const URL_SAVE = (codPrv) => `/proveedores/${codPrv}/formula/guardar`;

const ImportFormulaForm = ({ action_cancel, supplier = {}, token, t, formula = '', vars = [], setFormula, updateVariables }) => {

  const [variables, setVariables] = useState(vars);
  const [show_help, setShowHelp] = useState(false);
  const [current_row, setCurrentRow] = useState((vars.length > 0) ? (vars.length + 1) : 1);
  const [isValid, setIsValid] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const formulaInputRef = useRef(null);
  const {
    register, reset, setError, getValues, setValue, clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { static_variable: '', dynamic_variable: '', value: 0, formula: formula } });

  useEffect(() => {
    const options = vars.map((v, index) => {
      const id = index + 1;
      setValue(`data[${id}][value]`, v.valor);
      return { id, name: v.variable, value: v.valor, type: v.tipoVariable };
    });
    setVariables(options);
  }, []);



  const addStaticVariable = () => {
    let static_variable = getValues("static_variable");
    let error = false;
    if (static_variable == '') {
      setError('static_variable', { type: 'custom', message: t.required_field });
      error = true;
    }

    let value = getValues("value");
    if (value == "" || value == 0) {
      setError('value', { type: 'custom', message: t.required_field });
      error = true;
    }

    if (!error) {
      let options = [];
      options.push(...variables, { id: current_row, name: static_variable, value: value, type: 'FIJA' });
      setVariables(options);
      setCurrentRow(current_row + 1);
      reset({ static_variable: '', value: 0 });
    }
  }

  const addDynamicVariable = () => {

    let dynamic_variable = getValues("dynamic_variable");

    let error = false;
    if (dynamic_variable == '') {
      setError('dynamic_variable', { type: 'custom', message: t.required_select });
      error = true;
    }

    if (!error) {
      let options = [];
      options.push(...variables, { id: current_row, name: dynamic_variable, value: 0, type: 'DINAMICA' });
      setVariables(options);
      setCurrentRow(current_row + 1);
      setValue('dynamic_variable', '');
    }
  }

  const deleteRow = (id) => {
    let _rows = variables.filter((r) => {
      return id != r.id
    });

    setVariables(_rows);
  }

  const changeVar = (value) => {
    if (value.value != null) {
      clearErrors(["dynamic_variable"])
    }
    setValue('dynamic_variable', ((value.value) ?? null));
  }

  const onSubmit = async (data) => {
    const formula = getValues('formula');

    // Usar objeto en lugar de array
    let variable_values = {};
    variables.forEach(v => {
      variable_values[v.name] = Number(data.data[v.id].value);
    });

    const result = validateFormula(
      formula,
      Object.keys(variable_values),
      variable_values
    );

    // Validaciones
    if (
      formula === '' ||
      result.verifyValues.length > 0 ||
      result.unknownVars.length > 0 ||
      result.unusedVars.length > 0 ||
      !result.isValidSyntax
    ) {
      setIsValid(false);
      Swal.fire({
        title: t.error,
        text: t.formula_incorret_verify_again,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return;
    }

    // Payload correcto según DTO
    const data_save = {
      formula: formula,
      variables: variables.map(v => ({
        variable: v.name,
        valor: Number(data.data[v.id].value),
        tipoVariable: v.type
      }))
    };
    try {
      const rs = await axiosClient.put(URL_SAVE(supplier.CodPrv), data_save
      );


      if (rs.data?.formula) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: t.formula_save,
          showConfirmButton: false,
          timer: 1500
        }).then(() => {
          setFormula(formula);
          updateVariables(variables.map(v => ({
            variable:     v.name,
            valor:        Number(data.data[v.id].value),
            tipoVariable: v.type,
          })));
          action_cancel();
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: t.formula_error_save,
          showConfirmButton: false,
          timer: 1500
        });
      }


    } catch (error) {
      Swal.fire({
        title: t.error,
        text: t.formula_error_save_server,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    }
  };


  const verify = () => {
    const formula = getValues('formula');

    const data = getValues();
    var is_empty = false;
    if (formula == '') {
      setError('formula', { type: 'custom', message: t.required_field });
      is_empty = true;
    } else {
      clearErrors(["formula"]);
    }
    var variable_values = [];
    variables.map(v => {
      variable_values[[v.name]] = Number(data.data[v.id].value);
    });


    const result = validateFormula(formula, Object.keys(variable_values), variable_values);
    var msg = '<ul>';
    if (formula == '' || result.verifyValues.length > 0 || result.unknownVars.length > 0 || result.unusedVars.length || !result.isValidSyntax) {
      setIsValid(false);
      if (formula == '') {
        msg += `<li>${t.formula_cannot_be_empty}</li>`;
      }
      if (result.verifyValues.length > 0) {
        msg += `<li>${t.following_variables_must_have_a_numeric} : ${result.verifyValues}</li>`;
      }
      if (result.unknownVars.length > 0) {
        msg += `<li>${t.unknown_variables}: ${result.unknownVars}</li>`;
      }
      if (result.unusedVars.length > 0) {
        msg += `<li>${t.unused_variables}: ${result.unusedVars}</li>`;
      }
      if (!result.isValidSyntax) {
        msg += `<li>${t.formula_syntax_is_incorrect}</li>`;
      }
      msg += '</ul>';
      Swal.fire({
        title: t.error,
        html: msg,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
      return false;
    } else {
      const val = getValueFormula(formula, variable_values);

      Swal.fire({
        title: `${t.value_obtained}: ${val}`,
        text: t.its_right,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#15803d',
        confirmButtonText: t.yes_correct,
        cancelButtonText: t.no_correct,
        reverseButtons: true
      }).then(r => {
        if (r.isConfirmed) { setIsValid(true); }
      });
      return true;
    }


  }



  // 1. Validar sintaxis de la fórmula
  function isValidFormulaSyntax(formulaStr, vars) {
    try {
      // Intentamos usar 'new Function' con las variables definidas
      const varNames = Object.keys(vars);
      const func = new Function(...varNames, `return ${formulaStr}`);
      func(...varNames.map(v => vars[v])); // test execution
      return true;
    } catch (err) {
      //
      return false;
    }

  }

  // 2. Verificar que se usen solo variables válidas
  function getUsedVariables(formulaStr) {
    const tokens = formulaStr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    //
    const keywords = ['Math']; // podrías ampliar esta lista si usas funciones
    //
    return tokens.filter(t => !keywords.includes(t));
  }

  function verifyValues(variables) {
    //let valid = true;
    let values = [];
    for (const [key, value] of Object.entries(variables)) {


      if (typeof value !== 'number' || value <= 0 || isNaN(value)) {

        values.push(key);
        //valid = false;
      } else {

      }
    }

    return values;
  }

  function getValueFormula(formulaStr, vars) {
    try {
      const varNames = Object.keys(vars);
      const func = new Function(...varNames, `return ${formulaStr}`);
      return func(...varNames.map(v => vars[v]));
    } catch (err) {
      //
      return 0;
    }

  }

  function validateFormula(formulaStr, allowedVars, vars) {

    const usedVars = getUsedVariables(formulaStr);

    const unknownVars = usedVars.filter(v => !allowedVars.includes(v));
    const unusedVars = allowedVars.filter(v => !usedVars.includes(v));

    return {
      isValidSyntax: isValidFormulaSyntax(formulaStr, vars),
      unknownVars,
      unusedVars,
      //isVerifyValues: verifyValues(vars),
      verifyValues: verifyValues(vars),
      allVarsUsed: unusedVars.length === 0 && unknownVars.length === 0
    };
  }

  const handleFormulaInput = (e) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const match = before.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    if (match && variables.length > 0) {
      const prefix = match[0].toLowerCase();
      const filtered = variables.filter(
        v => v.name.toLowerCase().startsWith(prefix) && v.name.toLowerCase() !== prefix
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const applySuggestion = (varName) => {
    const input = formulaInputRef.current;
    if (!input) return;
    const val = input.value;
    const cursor = input.selectionStart;
    const before = val.slice(0, cursor);
    const after = val.slice(cursor);
    const match = before.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    if (match) {
      const newVal = before.slice(0, -match[0].length) + varName + after;
      setValue('formula', newVal);
      setSuggestions([]);
      const newCursor = before.length - match[0].length + varName.length;
      requestAnimationFrame(() => {
        input.setSelectionRange(newCursor, newCursor);
        input.focus();
      });
    }
  };

  const { ref: formulaRef, ...formulaRest } = register('formula', {
    required: { value: true, message: t.required_input },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ── Paneles de variables ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Variable estática — acento secondary (purple) */}
        <div className="rounded-xl border border-secondary/30 bg-secondary/5 dark:bg-secondary/10 p-4 space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            {t.static_variable}
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t.name}
              </label>
              <input
                type="text"
                autoComplete="off"
                {...register('static_variable', { required: false })}
                className="form-input w-full"
              />
              {errors.static_variable && (
                <span className="text-red-400 block text-xs mt-1">{errors.static_variable?.message?.toString()}</span>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t.value}
              </label>
              <input
                type="text"
                autoComplete="off"
                {...register('value', { required: false })}
                className="form-input w-full"
              />
              {errors.value && (
                <span className="text-red-400 block text-xs mt-1">{errors.value?.message?.toString()}</span>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={addStaticVariable}
              className="border border-secondary text-secondary bg-white dark:bg-transparent
                         hover:bg-secondary hover:text-white transition rounded-lg px-4 py-2 text-sm font-medium"
            >
              {t.add_variable}
            </button>
          </div>
        </div>

        {/* Variable dinámica — acento warning (orange) */}
        <div className="rounded-xl border border-warning/30 bg-warning/5 dark:bg-warning/10 p-4 space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            {t.dynamic_variable}
          </span>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t.select_option}
            </label>
            <div className="flex gap-0">
              <Select
                id="select-dynamic"
                placeholder={t.select_option}
                className="w-full"
                options={[
                  { value: t.var_cost, label: t.var_cost },
                  { value: t.var_weight, label: t.var_weight },
                ]}
                onChange={(e) => changeVar(e)}
                classNamePrefix="select"
                instanceId="select-dynamic-var"
              />
              <button
                type="button"
                onClick={() => setShowHelp(!show_help)}
                title="Ayuda"
                className={`flex items-center justify-center px-3 border border-l-0 border-gray-300
                           dark:border-gray-600 rounded-r-lg transition
                           ${show_help
                    ? 'bg-warning text-white border-warning'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-warning hover:border-warning hover:text-white'}`}
              >
                <IconHelpCircle className="h-4 w-4" />
              </button>
            </div>
            {errors.dynamic_variable && (
              <span className="text-red-400 block text-xs mt-1">{errors.dynamic_variable?.message?.toString()}</span>
            )}
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={addDynamicVariable}
              className="border border-warning text-warning bg-white dark:bg-transparent
                         hover:bg-warning hover:text-white transition rounded-lg px-4 py-2 text-sm font-medium"
            >
              {t.add_variable}
            </button>
          </div>
        </div>

      </div>

      {/* ── Nota de ayuda ────────────────────────────────────────────────── */}
      {show_help && (
        <div className="rounded-lg border-l-4 border-primary bg-primary/5 dark:bg-primary/10 p-4 text-sm text-gray-700 dark:text-gray-300">
          {t.formula_note}
        </div>
      )}

      {/* ── Tabla de variables + fórmula ─────────────────────────────────── */}
      {variables.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-3 text-center w-10"></th>
                  <th className="px-3 py-3 text-center w-10">#</th>
                  <th className="px-3 py-3 text-left">Variable</th>
                  <th className="px-3 py-3 text-left w-1/4">{t.value}</th>
                  <th className="px-3 py-3 text-left">{t.variable_type}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {variables.map((v, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        title={t.delete}
                        onClick={() => deleteRow(v.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <IconTrashLines className="h-4 w-4 text-red-400" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-500">{index + 1}</td>
                    <td className="px-3 py-2 font-mono text-gray-800 dark:text-gray-200">{v.name}</td>
                    <td className="px-3 py-2 w-1/4">
                      <input
                        type="text"
                        defaultValue={v.value}
                        autoComplete="off"
                        {...register(`data[${v.id}][value]`, { required: false })}
                        className="form-input w-full py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium
                        ${v.type === 'DINAMICA'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-secondary/10 text-secondary'}`}>
                        {v.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Campo fórmula con autocomplete */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.enter_the_formula}
            </label>
            <div className="relative">
              <div className="flex">
                <span className="flex items-center justify-center px-3 text-base font-bold text-gray-600
                                 dark:text-gray-300 border border-r-0 border-gray-300 dark:border-gray-600
                                 rounded-l-lg bg-gray-100 dark:bg-gray-700">
                  =
                </span>
                <input
                  type="text"
                  ref={(e) => { formulaRef(e); formulaInputRef.current = e; }}
                  {...formulaRest}
                  onInput={handleFormulaInput}
                  onKeyDown={(e) => { if (e.key === 'Escape') setSuggestions([]); }}
                  autoComplete="off"
                  className="form-input rounded-l-none flex-1"
                />
              </div>
              {suggestions.length > 0 && (
                <ul className="absolute left-9 right-0 z-50 mt-1 rounded-xl border border-gray-200
                               dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
                  {suggestions.map((v, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); applySuggestion(v.name); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm
                                   hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                      >
                        <span className="font-mono text-gray-800 dark:text-gray-200">{v.name}</span>
                        <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium
                          ${v.type === 'DINAMICA'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {v.type}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.formula && (
              <span className="text-red-400 block text-xs mt-1">{errors.formula?.message?.toString()}</span>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button type="button" className="btn btn-outline-danger" onClick={action_cancel}>
              {t.btn_cancel}
            </button>
            <button type="button" onClick={verify} className="btn btn-primary min-w-[100px]">
              {t.validate}
            </button>
            {isValid && (
              <button type="submit" className="btn btn-success min-w-[100px]">
                {t.btn_save}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-center pt-2 border-t border-gray-100 dark:border-gray-700">
          <button type="button" className="btn btn-outline-danger" onClick={action_cancel}>
            {t.btn_cancel}
          </button>
        </div>
      )}

    </form>
  );
};

export default ImportFormulaForm;
