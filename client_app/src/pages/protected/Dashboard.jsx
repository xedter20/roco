import { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../features/common/headerSlice';
import Dashboard from '../../features/dashboard/index';
import { LineChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { FaCheckCircle } from 'react-icons/fa'; // Add any icons you want to use
import axios from 'axios';
import { format, startOfToday } from 'date-fns';
import { formatAmount } from './../../features/dashboard/helpers/currencyFormat';

import DatePicker from "react-tailwindcss-datepicker";
import { DateTime } from 'luxon';

import Table, {
  AvatarCell,
  SelectColumnFilter,
  StatusPill,
  DateCell
} from '../../pages/protected/DataTables/Table'; // new


import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";
function InternalPage() {
  const dispatch = useDispatch();
  let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  // Set today's date as default for the DatePicker
  const today = startOfToday(); // Get today's date
  const [value, setValue] = useState({
    startDate: today,
    endDate: today
  });

  const navigate = useNavigate();
  const [resultData, setResultData] = useState([]);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const handleFilterClick = () => {
    setDropdownVisible((prev) => !prev);
  };

  const handleFilterChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedFilter(selectedValue);
    // Perform any filtering action here based on selectedValue
    console.log('Selected Filter:', selectedValue);
    // Optionally close the dropdown after selection
    // setDropdownVisible(false);
  };




  useEffect(() => {
    dispatch(setPageTitle({ title: 'Dashboard' }));
  }, []);


  return <div>
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl px-4">
        {[{
          label: 'Create and Setup New Library',
          color: '#98C1D9',
          thumbnail: 'https://img.freepik.com/free-vector/hand-drawn-flat-design-stack-books-illustration_23-2149341898.jpg?t=st=1733650397~exp=1733653997~hmac=897cb09187905291ad08035857a2f492788b438f03326709b4e3d557bdfdffe2&w=740'

          , link: '/app/libraries'
        },
        {
          label: 'View libraries',
          thumbnail: 'https://img.freepik.com/free-vector/library-building-concept-illustration_114360-21517.jpg?t=st=1733650487~exp=1733654087~hmac=a57360a9eed8c99c1a502eb5b862a6bf7ec3514c6b8c69003404d89d8f51204f&w=1060'
          ,
          link: '/app/libraries'
        },
        {
          label: 'Manage Admin Accounts',
          thumbnail: 'https://img.freepik.com/free-vector/multitasking-concept-with-man-desk-illustrated_23-2148392549.jpg?t=st=1733663021~exp=1733666621~hmac=c9b6fb7eb695ac5b7188d3fc4130b2204603e170af5dbd5588826ab9d8bb4d08&w=1060',
          link: '/app/admin_accounts'
        },
        ].map((item, index) => (
          <div

            onClick={() => {
              navigate(`${item.link}`); // Navigate to the desired route
            }}
            key={index}
            className={`cursor-pointer max-w-sm mx-auto rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 ease-in-out  hover:scale-105 hover:shadow-lg`}
          >
            <div className="card ">
              <figure>
                <img
                  src={item.thumbnail}
                  alt="Shoes"
                  className='h-40 w-full'
                />
              </figure>
              <div className="card-body">
                <h2 className="card-title uppercase text-slate-900 font-bold">{item.label}</h2>
                <p>If a dog chews shoes whose shoes does he choose?</p>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

export default InternalPage;
