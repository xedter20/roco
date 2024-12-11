import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../features/common/headerSlice';

import LoanApplication from '../../features/adminAccounts';

function InternalPage() {
  const dispatch = useDispatch();
  let loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  useEffect(() => {
    dispatch(setPageTitle({ title: 'Admins' }));
  }, []);

  return <LoanApplication />;
}

export default InternalPage;
