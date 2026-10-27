import React from 'react';
import {createRoot} from 'react-dom/client';
import Modal from '../../components/Modal';
import '../../index.css';
createRoot(document.getElementById('root')!).render(<Modal isOpen onClose={()=>{}} title="Product details" size="lg"><p>Product content</p></Modal>);
