import React, { Fragment } from "react";
import { Transition, Dialog, DialogPanel, TransitionChild } from '@headlessui/react';
import IconX from '@/components/icon/icon-x';

export default function Modal({ closeModal, openModal, title = '', content = null,children, showModal = false, show_buttons = false, size = "w-full max-w-lg", show_close_button = true }) {


  return (
    <>
      <Transition appear show={showModal} as={Fragment}>
        <Dialog as="div" onClose={closeModal}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >

            <div className="fixed inset-0" />
          </TransitionChild>
          <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
            <div className="flex min-h-screen items-start justify-center px-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel as="div" className={`panel my-8 ${size} overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark`}>
                  <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                    <div className="text-lg font-bold">{title}</div>
                    {(show_close_button) &&
                      <button type="button" className="text-white-dark hover:text-dark" onClick={closeModal}>
                        <IconX />
                      </button>
                    }
                  </div>
                  <div className="p-5">

                    <div>
                      {children ?? content}                      
                    </div>
                    {(show_buttons) &&
                      <div className="mt-8 flex items-center justify-end">
                        <button type="button" className="btn btn-outline-danger" onClick={closeModal}>
                          Discard
                        </button>
                        <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={closeModal}>
                          Save
                        </button>
                      </div>
                    }
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}