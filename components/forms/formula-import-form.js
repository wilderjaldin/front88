'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form"
import Select from 'react-select';
import axios from 'axios'
import Swal from 'sweetalert2'
import IconHelpCircle from '../icon/icon-help-circle';
import IconTrashLines from '../icon/icon-trash-lines';

const url_save = process.env.NEXT_PUBLIC_API_URL + 'proveedor/GuardarFormulaPrv';

const ImportFormulaForm = ({ action_cancel, supplier = {}, token, t, formula = '', vars = [], setFormula, updateVariables }) => {

  const [variables, setVariables] = useState(vars);
  const [show_help, setShowHelp] = useState(false);
  const [current_row, setCurrentRow] = useState((vars.length > 0) ? (vars.length + 1) : 1);
  const [isValid, setIsValid] = useState(false);
  const {
    register, reset, setError, getValues, setValue, clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { static_variable: '', dynamic_variable: '', value: 0, formula: formula } });

  useEffect(() => {
    let options = [];
    vars.map((v => {
      options.push({ id: v.CodVariable, name: v.Variable, value: v.Valor, type: v.Tipo });
      setValue(`data[${v.CodVariable}][value]`, v.Valor);
      
    }));
    setVariables(options);
    //reset({ static_variable: '', dynamic_variable: '', value: 0, formula: formula });
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

    var variable_values = [];
    variables.map(v => {
      variable_values[[v.name]] = Number(data.data[v.id].value);
    });
    const result = validateFormula(formula, Object.keys(variable_values), variable_values);
    if (formula == '' || result.verifyValues.length > 0 || result.unknownVars.length > 0 || result.unusedVars.length || !result.isValidSyntax) {
      setIsValid(false);
      Swal.fire({
        title: t.error,
        text: t.formula_incorret_verify_again,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: t.close
      });
    } else {
      let data_save = []
      variables.map(v => {
        //variable_values[[v.name]] = Number(data.data[v.id].value);
        data_save.push({
          CodPrv: supplier.CodPrv,
          Formula: formula,
          Variable: v.name,
          Valor: Number(data.data[v.id].value),
          Tipo: v.type,
          ValToken: token
        });
      });

      try {
        const rs = await axios.post(url_save, data_save);
        
        if (rs.data.estado == 'OK') {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: t.formula_save,
            showConfirmButton: false,
            timer: 1500
          }).then(r => {
            setFormula(formula);
            /*
            CodVariable:1
            Tipo:"DINAMICA"
            Valor:2
            Variable:"Costo"
            */
            var vars = [];
            variables.map(v => {
              vars.push({
                CodVariable: v.id,
                Tipo: v.type,
                Valor: Number(data.data[v.id].value),
                Variable: v.name
              });
            });
            
            updateVariables(vars);
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
    }

  }

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
        msg += `<li>${ t.formula_cannot_be_empty }</li>`;
      }
      if (result.verifyValues.length > 0) {
        msg += `<li>${ t.following_variables_must_have_a_numeric } : ${result.verifyValues}</li>`;
      }
      if (result.unknownVars.length > 0) {
        msg += `<li>${ t.unknown_variables }: ${result.unknownVars}</li>`;
      }
      if (result.unusedVars.length > 0) {
        msg += `<li>${ t.unused_variables }: ${result.unusedVars}</li>`;
      }
      if (!result.isValidSyntax) {
        msg += `<li>${ t.formula_syntax_is_incorrect }</li>`;
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
        title:  `${ t.value_obtained }: ${ val }`,
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

  return (
    <>
      <div className=''>
        <form className="mt-8 " onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:flex sm:flex-row  gap-4">
            <div className='basis-1/2 space-y-4 bg-gray-100 p-5'>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="static_variable">{ t.static_variable }</label>
                  <div className="relative ">
                    <input type='text' autoComplete='OFF' {...register("static_variable", { required: false })} className="form-input placeholder:" />
                    {errors.static_variable && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.static_variable?.message?.toString()}</span>}
                    {errors.weight && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.weight?.message?.toString()}</span>}
                  </div>
                </div>

                <div>
                  <label htmlFor="value">{ t.value }</label>
                  <div className="relative ">
                    <input type='text' id='value' autoComplete='OFF' {...register("value", { required: false })} className="form-input  ltr:rounded-r-none rtl:rounded-l-none placeholder:" />
                    {errors.value && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.value?.message?.toString()}</span>}
                  </div>
                </div>
              </div>



              <div className="flex flex-wrap items-center justify-center gap-2">
                <button onClick={() => addStaticVariable()} type='button' className="btn btn-dark flex justify-center items-center rounded-none px-3 font-semibold border border-white-light dark:border-[#17263c] dark:bg-[#1b2e4b]">
                  { t.add_variable }
                </button>
              </div>
            </div>
            <div className='basis-1/2 space-y-4 bg-gray-100 p-5'>


              <div>
                <label htmlFor="dynamic_variable">{ t.dynamic_variable }</label>
                <div className="flex flex-1">
                  <Select id='select-dynamic' {...register('dynamic_variable', { required: false })} placeholder={t.select_option} className={`w-full`} options={[{ value: t.var_cost, label: t.var_cost }, { value: t.var_weight, label: t.var_weight }]} onChange={(e) => changeVar(e)} />
                  <button type='button' onClick={() => setShowHelp(!show_help)} className={`${(show_help) ? 'bg-[#bbb]' : 'bg-[#eee]'} flex justify-center items-center ltr:rounded-r-md rtl:rounded-l-md px-3 font-semibold border ltr:border-l-0 rtl:border-r-0 border-white-light dark:border-[#17263c] dark:bg-[#1b2e4b]`}>
                    <IconHelpCircle></IconHelpCircle>
                  </button>
                </div>
                {errors.dynamic_variable && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.dynamic_variable?.message?.toString()}</span>}
              </div>


              <div className="flex flex-wrap items-center justify-center gap-2">
                <button onClick={() => addDynamicVariable()} type='button' className="btn btn-dark flex justify-center items-center rounded-none px-3 font-semibold border border-white-light dark:border-[#17263c] dark:bg-[#1b2e4b]">
                  { t.add_variable }
                </button>
              </div>
            </div>
          </div>

          {(show_help) &&
            <div className='rounded-br-md rounded-tr-md border border-l-2 border-white-light !border-l-primary bg-white mt-6 p-5 text-black shadow-md ltr:pl-3.5 rtl:pr-3.5 dark:border-[#060818] dark:bg-[#060818]'>
              { t.formula_note }
            </div>
          }
          {(variables.length > 0) ?
            <>
              <div className="table-responsive mt-4">
                <table className="bg-white table-striped table-hover">
                  <thead>
                    <tr>
                      <th className="bg-gray-400 text-center uppercase w-1"></th>
                      <th className="bg-gray-400 text-center uppercase">#</th>
                      <th className="bg-gray-400 text-center uppercase">Variable</th>
                      <th className="bg-gray-400 text-center uppercase w-1/5">{ t.value }</th>
                      <th className="bg-gray-400 text-center uppercase">{ t.variable_type }</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variables.map((v, index) => {
                      return (
                        <tr key={index}>
                          <td>
                            <button title={t.delete} type="button" className="btn btn-sm btn-danger" onClick={() => deleteRow(v.id)}><IconTrashLines /></button>
                          </td>
                          <td>{index + 1}</td>
                          <td>{v.name}</td>
                          <td className='w-1/5'>
                            <input type='text' defaultValue={v.value} autoComplete='OFF' {...register(`data[${v.id}][value]`, { required: false })} className="form-input border !border-black placeholder:" />
                          </td>
                          <td>{v.type}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className='my-4'>
                  <label htmlFor="">{ t.enter_the_formula }</label>
                  <div class="flex">
                    <div class="bg-gray-200 flex justify-center items-center ltr:rounded-l-md rtl:rounded-r-md px-3 text-lg font-bold border ltr:border-r-0 rtl:border-l-0 border-[#9ca3af] dark:border-[#17263c] dark:bg-[#1b2e4b]">=</div>
                    <input type="text" {...register('formula', { required: { value: true, message: t.required_input } })}  class="form-input ltr:rounded-l-none rtl:rounded-r-none" />
                  </div>
                  {errors.formula && <span className='text-red-400 error block text-xs mt-1' role="alert">{errors.formula?.message?.toString()}</span>}
                </div>
              </div>
              <div className="my-5">

                <div className="flex flex-wrap items-center justify-center gap-2">

                  <button type="button" className="btn btn-outline-danger" onClick={action_cancel}>{t.btn_cancel}</button>
                  <button type="button" onClick={() => verify()} className="btn btn-primary">
                    { t.validate }
                  </button>
                  {(isValid) &&
                    <button type="submit" className="btn btn-success">
                      { t.btn_save }
                    </button>
                  }

                </div>
              </div>
            </>
            :
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">

              <button type="button" className="btn btn-outline-danger" onClick={action_cancel}>{t.btn_cancel}</button>

            </div>
          }

        </form>
      </div>

    </>
  );
};

export default ImportFormulaForm;
