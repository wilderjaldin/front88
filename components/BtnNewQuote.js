'use client';

import React, { useEffect, useState } from 'react';
import SearchCustomerForm from "@/components/forms/search-customer"
import IconNewQuote from "@/components/icon/icon-new-quote";
import Modal from './modal';

const BtnNewQuote = ({ token, t, show_title = false, classNameBtn="", classNameIcon="" }) => {


  const [show_modal, setShowModal] = useState(false);
  const [modal_title, setModalTitle] = useState('');
  const [modal_content, setModalContent] = useState(null);

  const newQuote = () => {
    setModalTitle('');
    setModalContent(<SearchCustomerForm  close={() => setShowModal(false) } token={token} t={t}></SearchCustomerForm>);
    setShowModal(true);
  }
  
  return (
    <>
      <button type='button' onClick={() => newQuote()} className={classNameBtn}>
        <IconNewQuote className={classNameIcon}></IconNewQuote>
      </button>
      { (show_title) && <span className="block mt-2 rounded-full bg-[#1b2e4b] px-4 py-1.5 text-xs text-white before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-white ltr:before:mr-2 rtl:before:ml-2">{t.new_quote}</span> }
      <Modal size={'w-full max-w-xl'} closeModal={() => setShowModal(false)} openModal={() => setShowModal(true)} showModal={show_modal} title={modal_title} content={modal_content}></Modal>
    </>
  );
};

export default BtnNewQuote;
