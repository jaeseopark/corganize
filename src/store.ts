import { configureStore } from '@reduxjs/toolkit';
import filesReducer from './redux/files/slice';

export default configureStore({
  reducer: {
    files: filesReducer,
  },
});
