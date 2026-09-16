import React from "react";
import { Link, useOutletContext } from 'react-router-dom';

function About() {
  const {dark} = useOutletContext();
  return (
    <div className={dark ? 'text-white' : 'text-gray-900'}>
      <h4>Version 1.0.0</h4>
      <Link to='/'>Go Back</Link>
    </div>
  );
}
export default About;
