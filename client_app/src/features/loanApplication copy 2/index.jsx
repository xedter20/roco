import moment from 'moment';
import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../common/headerSlice';
import TitleCard from '../../components/Cards/TitleCard';
// import { RECENT_LoanApplication } from '../../utils/dummyData';
import FunnelIcon from '@heroicons/react/24/outline/FunnelIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import SearchBar from '../../components/Input/SearchBar';
import { NavLink, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ViewColumnsIcon from '@heroicons/react/24/outline/EyeIcon';
import PlusCircleIcon from '@heroicons/react/24/outline/PlusCircleIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

import PlayCircleIcon from '@heroicons/react/24/outline/PlusCircleIcon';
import {
  mdiAccount,
  mdiBallotOutline,
  mdiGithub,
  mdiMail,
  mdiUpload,
  mdiAccountPlusOutline,
  mdiPhone,
  mdiLock,
  mdiVanityLight,
  mdiLockOutline,
  mdiCalendarRange,
  mdiPhoneOutline,
  mdiMapMarker,
  mdiEmailCheckOutline,
  mdiAccountHeartOutline,
  mdiCashCheck,
  mdiAccountCreditCardOutline,
  mdiCreditCardOutline
} from '@mdi/js';
import 'react-tooltip/dist/react-tooltip.css'
// import Tooltip from 'react-tooltip';
import { Tooltip } from 'react-tooltip';
import {
  setAppSettings,
  getFeatureList
} from '../settings/appSettings/appSettingsSlice';

import Table, {
  AvatarCell,
  SelectColumnFilter,
  StatusPill,
  DateCell
} from '../../pages/protected/DataTables/Table'; // new

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import InputText from '../../components/Input/InputText';
import TextAreaInput from '../../components/Input/TextAreaInput';
import Dropdown from '../../components/Input/Dropdown';
import Radio from '../../components/Input/Radio';
import { Formik, useField, useFormik, Form } from 'formik';
import * as Yup from 'yup';

import FormWizard from 'react-form-wizard-component';
import 'react-form-wizard-component/dist/style.css';

import { useDropzone } from "react-dropzone";
import {
  regions,
  provinces,
  cities,
  barangays,
  provincesByCode,
  regionByCode
} from 'select-philippines-address';

import { FaCheckCircle } from "react-icons/fa"; // Font Awesome icon


import LoanCalculator from "./loanCalculator";
import { format, formatDistance, formatRelative, subDays } from 'date-fns';

import { formatAmount } from '../dashboard/helpers/currencyFormat';
const TopSideButtons = ({ removeFilter, applyFilter, applySearch, mylibraryList }) => {
  const [filterParam, setFilterParam] = useState('');
  const [searchText, setSearchText] = useState('');

  const locationFilters = [''];

  const showFiltersAndApply = params => {
    applyFilter(params);
    setFilterParam(params);
  };

  const removeAppliedFilter = () => {
    removeFilter();
    setFilterParam('');
    setSearchText('');
  };

  useEffect(() => {
    if (searchText === '') {
      removeAppliedFilter();
    } else {
      applySearch(searchText);
    }
  }, [searchText]);
  let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  return (
    <div className="inline-block float-right">
      {/* <SearchBar
        searchText={searchText}
        styleClass="mr-4"
        setSearchText={setSearchText}
      />
      {filterParam != '' && (
        <button
          onClick={() => removeAppliedFilter()}
          className="btn btn-xs mr-2 btn-active btn-ghost normal-case">
          {filterParam}
          <XMarkIcon className="w-4 ml-2" />
        </button>
      )} */}
      <div className="badge badge-neutral mr-2 px-4 p-4 bg-white text-blue-950">Total : {mylibraryList.length}</div>

      <button className="btn btn-outline bg-blue-950 text-white" onClick={() => document.getElementById('addLibrary').showModal()}>
        Add
        <PlusCircleIcon className="h-6 w-6 text-white-500" />
      </button>

      {/* 
      <button
        className="btn ml-2 font-bold bg-yellow-500 text-white"
        onClick={() => document.getElementById('my_modal_1').showModal()}>
        Import from file
        <PlusCircleIcon className="h-6 w-6 text-white-500" />
      </button> */}

      {/* <div className="dropdown dropdown-bottom dropdown-end">
        <label tabIndex={0} className="btn btn-sm btn-outline">
          <FunnelIcon className="w-5 mr-2" />
          Filter
        </label>
        <ul
          tabIndex={0}
          className="z-40 dropdown-content menu p-2 text-sm shadow bg-base-100 rounded-box w-52">
          {locationFilters.map((l, k) => {
            return (
              <li key={k}>
                <a onClick={() => showFiltersAndApply(l)}>{l}</a>
              </li>
            );
          })}
          <div className="divider mt-0 mb-0"></div>
          <li>
            <a onClick={() => removeAppliedFilter()}>Remove Filter</a>
          </li>
        </ul>
      </div> */}
    </div>
  );
};

function LoanApplication() {


  // Define file handling logic
  const [files, setFiles] = useState({
    borrowerValidID: null,
    bankStatement: null,
    coMakersValidID: null,
  });

  const onDrop = (acceptedFiles, fieldName) => {
    setFiles((prevFiles) => ({
      ...prevFiles,
      [fieldName]: acceptedFiles[0],
    }));
  };

  const dropzoneProps = (fieldName) => ({
    onDrop: (files) => onDrop(files, fieldName),
    accept: {
      "image/*": [".jpeg", ".png", ".jpg"],
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  const [file, setFile] = useState(null);
  const [faqList, setList] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeChildID, setactiveChildID] = useState('');
  const [selectedLoan, setselectedLoan] = useState({});
  const [isEditModalOpen, setisEditModalOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();



  const [addressRegions, setRegions] = useState([]);
  const [addressProvince, setProvince] = useState([]);
  const [addressCity, setCity] = useState([]);
  const [addressBarangay, setBarangay] = useState([]);

  const [mylibraryList, setlibraryList] = useState([]);

  const prepareAddress = async () => {
    await regions().then(region => {

      console.log({ region })
      setRegions(
        region.map(r => {
          return {
            value: r.region_code,
            label: r.region_name
          };
        })
      );
    });
    // await regionByCode('01').then(region => console.log(region.region_name));
    await provinces().then(province => console.log(province));
    // await provincesByCode('01').then(province => console.log(province));
    // await provinceByName('Rizal').then(province =>
    //   console.log(province.province_code)
    // );
    await cities().then(city => console.log(city));
    await barangays().then(barangays => console.log(barangays));
  };

  const libraryList = async () => {

    let res = await axios({
      method: 'POST',
      url: '/library/list',
      data: {

      }
    });
    let list = res.data.data;

    setlibraryList(list)


  };

  useEffect(() => {


    prepareAddress();
    libraryList()
    setIsLoaded(true);
  }, []);



  const appSettings = useSelector(state => state.appSettings);
  let { codeTypeList, packageList } = appSettings;

  const removeFilter = async () => {
    // let res = await axios({
    //   method: 'POST',
    //   url: 'user/getChildrenList',
    //   data: {
    //     sponsorIdNumber: ''
    //   }
    // });
    // let list = res.data.data;

    // console.log({ list });
    // setList(list);
  };

  const applyFilter = params => {
    let filteredfaqList = faqList.filter(t => {
      return t.address === params;
    });
    setList(filteredfaqList);
  };

  // Search according to name
  const applySearch = value => {
    let filteredUsers = users.filter(t => {
      return (
        t.email.toLowerCase().includes(value.toLowerCase()) ||
        t.firstName.toLowerCase().includes(value.toLowerCase()) ||
        t.lastName.toLowerCase().includes(value.toLowerCase())
      );
    });
    setList(filteredUsers);
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  // console.log(users);
  let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  const columns = useMemo(
    () => [

      {
        Header: '#',
        accessor: '',
        Cell: ({ row }) => {
          return <span className="">{row.index + 1}</span>;
        }
      },
      {
        Header: 'Library Name',
        accessor: 'name',
        Cell: ({ row, value }) => {
          return <span className="text-blue-900 font-bold">{value}</span>;
        }
      },
      // {
      //   Header: 'Loan Amount',
      //   accessor: 'loan_amount',
      //   Cell: ({ row, value }) => {
      //     return <span className="">{formatAmount(value)}</span>;
      //   }
      // },
      // {
      //   Header: 'Interest Rate',
      //   accessor: 'interest_rate',
      //   Cell: ({ row, value }) => {
      //     return <span className="">{value}</span>;
      //   }
      // },
      // {
      //   Header: 'Months To Pay',
      //   accessor: 'repayment_schedule_id',
      //   Cell: ({ row, value }) => {
      //     return <span className="">{value} Months</span>;
      //   }
      // },
      {
        Header: 'Date Created',
        accessor: 'created_at',
        Cell: ({ row, value }) => {
          return <span className="">

            {value &&
              format(value, 'MMM dd, yyyy')}

          </span>;
        }
      },



      {
        Header: 'Action',
        accessor: '',
        Cell: ({ row }) => {
          let loan = row.original;



          return (
            (
              <div className="flex">

                <button className="btn btn-outline btn-sm" onClick={() => {

                  // setisEditModalOpen(true)
                  setselectedLoan(loan);

                  document.getElementById('viewLoan').showModal();
                  // setFieldValue('Admin_Fname', 'dex');
                }}>
                  <i class="fa-solid fa-eye"></i>
                </button>

                {/* <button
                  className="btn btn-outline btn-sm ml-2"
                  onClick={() => {


                    setactiveChildID(l.id);

                  }}>
                  <i class="fa-solid fa-archive"></i>
                </button> */}
              </div>
            )
          );
        }
      },

    ],
    []
  );

  const handleOnChange = e => {
    console.log(e.target.files[0]);
    setFile(e.target.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append('file', file);
      let res = await axios({
        // headers: {
        //   'content-type': 'multipart/form-data'
        // },
        method: 'POST',
        url: 'user/uploadFile',
        data
      });

      setIsSubmitting(false);
      fetchFaqList();
      toast.success(`Uploaded Successfully`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light'
      });
    } catch (error) {
      toast.error(`Something went wrong`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light'
      });
    } finally {
      document.getElementById('my_modal_1').close();
    }
  };


  const [currentStep, setCurrentStep] = useState(0);






  const getAll = async () => {

    let regionCode = '05';
    let address_province_value = await provincesByCode(regionCode).then(
      province => {
        setProvince(
          province.map(p => {
            return {
              value: p.province_code,
              label: p.province_name
            };
          })
        );
      }
    );

    await cities('0517').then(cities => {
      setCity(
        cities.map(p => {
          return {
            value: p.city_code,
            label: p.city_name
          };
        })
      );
    });





  }

  useEffect(() => {
    getAll();
  }, []);



  const formikConfig = () => {








    let PersonalInfoTabValidation = {};

    if (currentStep === 0) {
      PersonalInfoTabValidation = {

        name: Yup.string()
          .required('Required'),
        address_barangay: Yup.string()
          .required('Required'),

        address_city: Yup.string()
          .required('Required'),



      }
    }
    else if (currentStep === 1) {


      PersonalInfoTabValidation = {


      }
    }

    else if (currentStep === 3) {
      PersonalInfoTabValidation = {

      }
    }



    return {
      initialValues: {
        "db_host": 'jcqlf1.stackhero-network.com',
        "db_user": "root",
        "address_region": "05",
        "address_province": "0517",
        "address_city": "051724",
        "address_barangay": "",
        "db_password": "OwhHbxDtBwsDB9VlClLwfkzw9MTBr70m"


      },
      validationSchema: Yup.object({
        ...PersonalInfoTabValidation

      }),
      // validateOnMount: true,
      // validateOnChange: false,
      onSubmit: async (values, { setFieldError, setSubmitting, resetForm }) => {
        setSubmitting(true);


        let res = await axios({
          method: 'post',
          url: `/createLibrary`,
          data: values
        })




        document.getElementById('addLibrary').close();
        resetForm();
        toast.success('Successfully created!', {
          onClose: () => {

          },
          position: 'top-right',
          autoClose: 500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light'
        });


      }
    };
  };


  const DropzoneArea = ({ fieldName, files, dropzoneProps, setFieldValue, errors }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      ...dropzoneProps,
      onDrop: (acceptedFiles) => {

        setFieldValue(fieldName, acceptedFiles[0]);
        if (acceptedFiles.length > 0) {
          // Update files state with the new file
          setFiles((prevFiles) => ({
            ...prevFiles,
            [fieldName]: acceptedFiles[0],
          }));
        }
      },
    });


    let hasError = errors[fieldName];
    return (
      <div
        {...getRootProps()}
        className={`flex justify-center items-center w-full h-32 p-4 border-2 
       
          ${isDragActive ? "border-blue-500" : "border-gray-300"
          } border-dashed rounded-md text-sm cursor-pointer`}
      >
        <input {...getInputProps()} />
        <div>
          {files[fieldName] ? (
            <p className="text-gray-700">
              {files[fieldName].name} <span className="text-green-500">(Selected)</span>
            </p>
          ) : (
            <p className="text-gray-500">
              Drag and drop a file here, or click to select a file.
            </p>
          )}
        </div>
      </div>
    );
  };



  return (

    <TitleCard
      title="List"
      topMargin="mt-2"
      TopSideButtons={
        <TopSideButtons
          applySearch={applySearch}
          applyFilter={applyFilter}
          removeFilter={removeFilter}
          mylibraryList={mylibraryList}
        />
      }>
      <div className="">

        <dialog id="addLibrary" className="modal">
          <div className="modal-box w-11/12 max-w-5xl">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h1 className="font-bold text-lg  p-4 
 bg-gradient-to-r from-gray-200 to-gray-300
      z-10 text-blue-950 border bg-white
             rounded">New Library</h1>
            <p className="text-sm text-gray-500 mt-1 font-bold"></p>
            <div className="p-2 space-y-4 md:space-y-6 sm:p-4">
              <Formik {...formikConfig()}>
                {({
                  validateForm,
                  handleSubmit,
                  handleChange,
                  handleBlur, // handler for onBlur event of form elements
                  values,
                  touched,
                  errors,
                  submitForm,
                  setFieldTouched,
                  setFieldValue,
                  setFieldError,
                  setErrors,
                  isSubmitting
                }) => {

                  const PersonalInfo = useMemo(() => (
                    <div>
                      <Form className="">


                        <div className="grid grid-cols-1 gap-3 md:grid-cols-1 mb-4 ">
                          <InputText
                            isRequired
                            placeholder=""
                            label="Library Name"
                            name="name"
                            type="text"
                            value={values.name} // Bind value to Formik state
                            onBlur={handleBlur}
                            onChange={(e) => {


                              // u962341333_ prefix
                              setFieldValue('name', e.target.value); // Use the input value


                              const sanitizedValue = e.target.value
                                .toLowerCase() // Convert to lowercase
                                .replace(/[^a-z0-9_]/g, ''); // Remove special characters (allowing only lowercase letters, numbers, and underscores)

                              // Prepend the prefix to the sanitized value
                              const updatedValue = `${sanitizedValue}`;


                              setFieldValue('db_name', updatedValue); // Update Formik state with the concatenated value

                            }}
                          />



                        </div>

                        <div className="z-50 grid grid-cols-1 gap-3 md:grid-cols-4 ">
                          <Dropdown
                            className="z-50"
                            isDisabled

                            label="Region"
                            name="address_region"
                            value={values.address_region}
                            disabled
                            onBlur={handleBlur}
                            options={addressRegions}
                            // affectedInput="address_province"
                            // allValues={values}
                            setFieldValue={setFieldValue}
                            functionToCalled={async regionCode => {

                              console.log({ regionCode })
                              if (regionCode) {
                                setFieldValue('address_province', '');
                                await provincesByCode(regionCode).then(
                                  province => {
                                    setProvince(
                                      province.map(p => {
                                        return {
                                          value: p.province_code,
                                          label: p.province_name
                                        };
                                      })
                                    );
                                  }
                                );
                              }
                            }}
                          />

                          <Dropdown
                            className="z-50"
                            isDisabled
                            label="Province"
                            name="address_province"
                            value={values.address_province}
                            d
                            setFieldValue={setFieldValue}
                            onBlur={handleBlur}
                            options={addressProvince}
                            affectedInput="address_city"
                            functionToCalled={async code => {
                              console.log({ code })
                              if (code) {
                                await cities(code).then(cities => {
                                  setCity(
                                    cities.map(p => {
                                      return {
                                        value: p.city_code,
                                        label: p.city_name
                                      };
                                    })
                                  );
                                });
                              }
                            }}
                          />
                          <Dropdown
                            className="z-50"

                            label="City"
                            name="address_city"
                            // value={values.civilStatus}
                            setFieldValue={setFieldValue}
                            onBlur={handleBlur}
                            options={addressCity}
                            affectedInput="address_barangay"
                            functionToCalled={async code => {


                              if (code) {
                                await barangays(code).then(cities => {
                                  setBarangay(
                                    cities.map(p => {
                                      console.log({ p });
                                      return {
                                        value: p.brgy_code,
                                        label: p.brgy_name
                                      };
                                    })
                                  );
                                });
                              }
                            }}
                          />
                          <Dropdown
                            className="z-50"

                            label="Barangay"
                            name="address_barangay"
                            value={values.address_barangay}

                            onBlur={handleBlur}
                            options={addressBarangay}
                            affectedInput=""
                            functionToCalled={async code => { }}
                            setFieldValue={setFieldValue}
                          />
                        </div>

                      </Form>
                    </div>
                  ), [currentStep, errors, values, addressRegions, addressProvince, addressCity, addressBarangay]);


                  const AccountDetails = useMemo(() => (
                    <div>


                      <Form className="">

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4 ">
                          <InputText
                            disabled
                            isReadOnly={true}
                            isRequired
                            placeholder=""
                            label="Database Host"
                            name="db_host"
                            type="text"
                            value={values.db_host} // Bind value to Formik state
                            onBlur={handleBlur}
                            onChange={(e) => {


                              setFieldValue('db_host', e.target.value); // Use the input value
                            }}
                          />

                          <InputText
                            disabled
                            isReadOnly={true}
                            placeholder=""
                            label="Database Name"
                            name="db_host"
                            type="text"
                            value={values.db_name} // Bind value to Formik state
                            onBlur={handleBlur}
                            onChange={(e) => {


                              setFieldValue('db_name', e.target.value); // Use the input value
                            }}
                          />

                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4 ">
                          <InputText
                            disabled
                            isReadOnly={true}
                            isRequired
                            placeholder=""
                            label="Database User"
                            name="db_user"
                            type="text"
                            value={values.db_user} // Bind value to Formik state
                            onBlur={handleBlur}
                            onChange={(e) => {


                              setFieldValue('db_user', e.target.value); // Use the input value
                            }}
                          />

                          <InputText
                            disabled
                            isReadOnly={true}
                            isRequired
                            placeholder=""
                            label="Database Password"
                            name="db_host"
                            type="text"
                            value={values.db_password} // Bind value to Formik state
                            onBlur={handleBlur}
                            onChange={(e) => {


                              setFieldValue('db_password', e.target.value); // Use the input value
                            }}
                          />

                        </div>
                      </Form>
                    </div>
                  ), [currentStep, errors, values]);













                  const steps = [

                    {
                      label: 'Library Information', content: () => {
                        return PersonalInfo
                      }
                    },
                    {
                      label: 'Database Information', content: () => {
                        return AccountDetails
                      }
                    },

                  ];

                  const nextStep = async () => {

                    // setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
                    // return true;
                    const formErrors = await validateForm();



                    console.log({ currentStep })

                    if (currentStep === 2) {
                      const validateFields = (fields, setFieldError) => {
                        const fieldErrors = {
                          borrowerValidID: "Borrower's Valid ID is required",
                          bankStatement: "Bank Statement is required",
                          coMakersValidID: "Co-maker's Valid ID is required",
                        };

                        // Loop through fields to check and set errors
                        Object.keys(fieldErrors).forEach((field) => {
                          if (!fields[field]) {
                            setFieldError(field, fieldErrors[field]);
                          }
                        });
                      };


                      let { borrowerValidID, bankStatement, coMakersValidID } = values;
                      if (!borrowerValidID || !bankStatement || !coMakersValidID) {

                        validateFields({ borrowerValidID, bankStatement, coMakersValidID }, setFieldError);


                        return true


                      }
                      else {
                        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
                      }
                    } else {
                      // Dynamically set errors using setFieldError
                      for (const [field, error] of Object.entries(formErrors)) {

                        setFieldTouched(field, true); // Mark field as touched
                        setFieldError(field, error); // Set error for each field dynamically
                      }

                      if (Object.keys(formErrors).length === 0) {
                        //  handleSubmit(); // Only proceed to next step if there are no errors
                        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
                      }
                    }





                  };

                  const prevStep = () => {
                    setCurrentStep((prev) => Math.max(prev - 1, 0));
                  };

                  // const stepContent = useMemo(() => steps[currentStep].content(), [currentStep]);



                  return (
                    <div>
                      <div className="mt-4">
                        <div className="">
                          {/* Step Navigation Menu */}
                          <div className="flex justify-between mb-4">
                            {steps.map((step, index) => (
                              <div
                                key={index}
                                className={`cursor-pointer text-center flex-1 ${currentStep === index ? 'text-customBlue  font-bold' : 'text-gray-400'
                                  }`}
                                onClick={() => index <= currentStep && setCurrentStep(index)}
                              >
                                <span>{step.label}</span>
                                <div
                                  className={`mt-2 h-1 rounded ${currentStep === index ? 'bg-customBlue' : 'bg-transparent'
                                    }`}
                                />
                              </div>
                            ))}
                          </div>

                          {/* <h2 className="text-xl font-bold mb-4">{steps[currentStep].label}</h2> */}


                          {steps[currentStep].content()}
                          <div className="flex justify-between mt-4">
                            {currentStep > 0 && (
                              <button onClick={prevStep}
                                className="btn  bg-gray-200 text-black">
                                Previous
                              </button>
                            )}
                            {currentStep < steps.length - 1 ? (
                              <button onClick={nextStep} className="btn btn-primary bg-buttonPrimary">
                                Next
                              </button>
                            ) : (
                              <button

                                onClick={handleSubmit}

                                disabled={isSubmitting}

                                className="btn btn-success bg-buttonPrimary text-white">

                                {isSubmitting ? (
                                  <span className="w-4 h-4 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mr-2"></span>

                                ) : (
                                  "" // Default text
                                )}
                                Submit
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                }}
              </Formik> </div>
          </div>
        </dialog >


        <dialog id="viewLoan" className="modal">
          <div className="modal-box w-11/12 max-w-5xl">

            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => {
                setselectedLoan({})
                document.getElementById("viewLoan").close()
              }}


            >✕</button>

            <div className="modal-header flex items-center justify-between p-4 bg-gradient-to-r from-gray-200 to-gray-300
      z-10 text-blue-950 border bg-white text-blue-950  rounded-t-lg">
              <h1 className="text-xl font-bold"> Details</h1>

            </div>

            <p className="text-sm text-gray-500 mt-1 font-bold"></p>
            <div className="p-2 space-y-4 md:space-y-6 sm:p-4">
              <StatusPill value={selectedLoan.loan_status} />
              {selectedLoan.loan_application_id && <Formik
                initialValues={{
                  calculatorLoanAmmount: parseFloat(selectedLoan.loan_amount),
                  calculatorInterestRate: parseFloat(selectedLoan.interest_rate),
                  calculatorMonthsToPay: parseFloat(selectedLoan.repayment_schedule_id),

                }}
              >
                {({
                  validateForm,
                  handleSubmit,
                  handleChange,
                  handleBlur, // handler for onBlur event of form elements
                  values,
                  touched,
                  errors,
                  submitForm,
                  setFieldTouched,
                  setFieldValue,
                  setFieldError,
                  setErrors,
                  isSubmitting
                }) => {

                  console.log({ values })


                  return <LoanCalculator
                    isReadOnly={true}
                    values={values}
                    setFieldValue={setFieldValue}
                    handleBlur={handleBlur}
                    calculatorLoanAmmount={values.calculatorLoanAmmount}
                    calculatorInterestRate={values.calculatorInterestRate}
                    calculatorMonthsToPay={values.calculatorMonthsToPay}
                    calculatorTotalAmountToPay={values.calculatorTotalAmountToPay}
                  />


                }}</Formik>
              }

            </div>
          </div>
        </dialog >
        <Table
          style={{ overflow: 'wrap' }}
          className="table-sm"
          columns={columns}
          data={(mylibraryList || []).map(data => {
            return {
              ...data

            };
          })}
          searchField="lastName"
        />
      </div >

      <ToastContainer />









    </TitleCard >

  );
}

export default LoanApplication;
