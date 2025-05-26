
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom';
import './assets/scss/all.scss';
import routes from './assets/routes/index'
import { store } from './assets/redux/store';
import { Provider } from 'react-redux';

const router = createHashRouter(routes);

createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <RouterProvider router={router} />
    </Provider>
)
