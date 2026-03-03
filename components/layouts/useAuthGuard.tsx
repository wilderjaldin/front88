import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { useDispatch, useSelector } from 'react-redux';
import { selectToken, setAuth } from '@/store/authSlice';


const useAuthGuard = () => {
  const token = useSelector(selectToken);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) {
    router.push('/');
      return;
    }

    const decoded: { exp: number } = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();

    if (isExpired) {
      dispatch(setAuth({ token: null, user: null }))
      router.push('/');
    }
  }, [token]);
};

export default useAuthGuard;
