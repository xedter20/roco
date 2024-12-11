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
      {/* <div className="badge badge-neutral mr-2 px-4 p-4 bg-white text-blue-950">Total : {mylibraryList.length}</div> */}

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
  const [listLibraries, setlistLibraries] = useState([]);

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

  const adminList = async () => {

    let res = await axios({
      method: 'GET',
      url: '/user',
      data: {

      }
    });
    let list = res.data.data;

    setlibraryList(list)
    setIsLoaded(true);

  };


  const libraryList = async () => {

    let res = await axios({
      method: 'post',
      url: '/library/list',
      data: {

      }
    });
    let list = res.data.data;



    console.log({ dex: list })

    setlistLibraries(list.map(l => {
      return {
        value: l.library_id,
        label: l.name
      }
    }))


  };

  useEffect(() => {


    prepareAddress();
    adminList();
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
        Header: 'Library',
        accessor: 'library_name',
        Cell: ({ row, value }) => {
          return <span className="font-bold">{value}</span>;
        }


      },
      {
        Header: 'Full Name',
        accessor: 'full_name',
      },
      {
        Header: 'Email',
        accessor: 'email',
      }, {
        Header: 'Phone Number',
        accessor: 'phone_number',
      },
      {
        Header: 'Address',
        accessor: 'admin_address',
      },
      {
        Header: 'Account Type',
        accessor: 'account_type',
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
        accessor: 'date_created',
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

                <button
                  className="btn btn-outline btn-sm ml-2 text-red-500"
                  onClick={() => {
                    document.getElementById('viewLoan').showModal();

                    setactiveChildID(l.id);

                  }}>
                  <i class="fa-solid fa-archive"></i>
                </button>
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

        account_type: Yup.string().required('Account type is required'),
        library_id: Yup.string().required('Library is required'),
        username: Yup.string()
          .required('Username is required')
          .min(4, 'Username must be at least 4 characters'),
        full_name: Yup.string().required('Full Name is required'),
        email: Yup.string()
          .required('Email is required')
          .email('Invalid email format'),
        phone_number: Yup.string()
          .required('Phone number is required')
          .matches(/^[0-9]+$/, 'Phone number must be digits only')
          .min(10, 'Phone number must be at least 10 digits'),
        address: Yup.string().required('Address is required'),


      }
    }



    return {
      initialValues: {

        username: '',
        full_name: '',
        phone_number: '',
        address: '',
        city: '',
        zip_code: '',
        account_type: 'Admin',

        email: '',

        library_id: '',

      },
      validationSchema: Yup.object({
        ...PersonalInfoTabValidation

      }),
      // validateOnMount: true,
      // validateOnChange: false,
      onSubmit: async (values, { setFieldError, setSubmitting, resetForm }) => {
        setSubmitting(true);



        try {
          let res = await axios({
            method: 'post',
            url: `/user/create`,
            data: values,
          });

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
          document.getElementById('addLibrary').close();
          adminList();
        } catch (err) {
          // Check if the server responded with an error
          if (err.response) {
            // Display the error message returned by the server
            alert(`Error: ${err.response.data.message}`);
          } else if (err.request) {
            // Request was made but no response was received
            alert('Error: No response received from the server.');
          } else {
            // Something else caused the error
            alert(`Error: ${err.message}`);
          }
        }




        // resetForm();
        // toast.success('Successfully created!', {
        //   onClose: () => {

        //   },
        //   position: 'top-right',
        //   autoClose: 500,
        //   hideProgressBar: false,
        //   closeOnClick: true,
        //   pauseOnHover: true,
        //   draggable: true,
        //   progress: undefined,
        //   theme: 'light'
        // });


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





  const [selectedLibrary, setSelectedLibrary] = useState('All');

  // Filter data based on selectedLibrary
  const filteredData =
    selectedLibrary === 'All'
      ? mylibraryList
      : mylibraryList.filter(item => item.library_name === selectedLibrary);

  // Unique library names for tabs
  let libraryNames2 = listLibraries.map((l) => {
    return l.label;
  })

  let libraryNames = Array.from(new Set([
    ...mylibraryList.map(item => item.library_name),
    ...libraryNames2


  ]));




  return isLoaded && (

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
          <div className="modal-box w-11/12 max-w-2xl">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h1 className="font-bold text-lg  p-4 
 bg-gradient-to-r from-gray-200 to-gray-300
      z-10 text-blue-950 border bg-white
             rounded">Create Admin</h1>
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
                      <Form className="p-4">


                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4">

                          <Radio
                            isRequired
                            label="Account Type"
                            name="account_type" // This should be "loan_type"
                            value={values.account_type}
                            setFieldValue={setFieldValue}
                            onBlur={handleBlur}
                            options={[
                              { value: 'Admin', label: 'Admin' },
                              { value: 'Staff', label: 'Staff' }
                            ]}
                          />

                          <Dropdown
                            className="z-50"

                            label="Select Library"
                            name="library_id"
                            value={values.library_id}

                            onBlur={handleBlur}
                            options={listLibraries}
                            setFieldValue={setFieldValue}
                            functionToCalled={async regionCode => {

                            }}
                          />


                        </div>

                        <div
                          className={`mt-2 h-1 rounded bg-customBlue mb-2
                            }`}
                        />
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4">
                          {/* Admin ID (readonly) */}

                          {/* Username */}
                          <InputText
                            isRequired
                            placeholder="Enter Username"
                            label="Username"
                            name="username"
                            type="text"
                            value={values.username}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />

                          {/* Full Name */}
                          <InputText
                            isRequired
                            placeholder="Enter Full Name"
                            label="Full Name"
                            name="full_name"
                            type="text"
                            value={values.full_name}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />

                          <InputText
                            isRequired
                            placeholder="Enter Address"
                            label="Email"
                            name="email"
                            type="text"
                            value={values.email}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />


                          {/* Phone Number */}
                          <InputText
                            isRequired
                            placeholder="Enter Phone Number"
                            label="Phone Number"
                            name="phone_number"
                            type="text"
                            value={values.phone_number}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />

                          {/* Address */}




                        </div>

                        <div>
                          <InputText
                            isRequired
                            placeholder="Enter Address"
                            label="Address"
                            name="address"
                            type="text"
                            value={values.address}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          />

                        </div>

                        {/* Submit Button */}
                        {/* <div className="flex justify-end">
                          <button type="submit" className="btn btn-primary">
                            Submit
                          </button>
                        </div> */}
                      </Form>
                    </div>
                  ), [currentStep, errors, values, libraryList
                  ]);













                  const steps = [

                    {
                      label: 'Library Information', content: () => {
                        return PersonalInfo
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
                          <div className="flex justify-between mb-0">
                            {steps.map((step, index) => (
                              <div
                                key={index}
                                className={`cursor-pointer text-center flex-1 ${currentStep === index ? 'text-customBlue  font-bold' : 'text-gray-400'
                                  }`}
                                onClick={() => index <= currentStep && setCurrentStep(index)}
                              >
                                {/* <span>{step.label}</span> */}
                                {/* <div
                                  className={`mt-2 h-1 rounded ${currentStep === index ? 'bg-customBlue' : 'bg-transparent'
                                    }`}
                                /> */}
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

        <div className="flex space-x-4 mb-4 border-b border-gray-200">
          <button
            className={`py-2 px-4 ${selectedLibrary === 'All' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            onClick={() => setSelectedLibrary('All')}
          >
            All
          </button>
          {libraryNames.map(name => (
            <button
              key={name}
              className={`py-2 px-4 ${selectedLibrary === name ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
              onClick={() => setSelectedLibrary(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <Table
          style={{ overflow: 'wrap' }}
          className="table-sm"
          columns={columns}
          data={filteredData.map(data => ({
            ...data,
          }))}
          searchField="lastName"
        />
      </div >

      <ToastContainer />









    </TitleCard >

  );
}

export default LoanApplication;
