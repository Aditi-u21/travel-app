/*
import { Button } from '@/components/ui/button';
import { db } from '@/Service/Firebase';
import { doc, getDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom'; // Add useNavigate
import Locationinfo from '../Elements/Locationinfo';
import Hotels from '../Elements/Hotels';
import { LogInContext } from '@/Context/LogInContext/Login';
import Places from '../Elements/Places';

function Mytrips() {
  const { tripId } = useParams();
  const { setTrip } = useContext(LogInContext);
  const navigate = useNavigate(); // Initialize useNavigate

  const getTripData = async () => {
    const docRef = doc(db, 'Trips', tripId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setTrip(docSnap.data());
    } else {
      toast.error('No Such Trip');
    }
  };

  useEffect(() => {
    tripId && getTripData();
  }, [tripId]);

  // Function to navigate to checklist with tripId
  const goToChecklist = () => {
    navigate("/checklist", { state: { tripId } });
  };

  return (
    <div className='py-2'>
      <Locationinfo />
      <Hotels />
      <Places />
      <div className="mt-4 flex justify-center">
        <Button onClick={goToChecklist}>
          View Checklist
        </Button>
      </div>
    </div>
  );
}

export default Mytrips;
*/
import { Button } from '@/components/ui/button';
import { LogInContext } from '@/Context/LogInContext/Login';
import { db } from '@/Service/Firebase';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import Hotels from '../Elements/Hotels';
import Locationinfo from '../Elements/Locationinfo';
import Places from '../Elements/Places';

function Mytrips() {
  const { tripId } = useParams();
  const { trip, setTrip } = useContext(LogInContext); // Ensure trip is retrieved from context
  const navigate = useNavigate();

  const getTripData = async () => {
    const docRef = doc(db, 'Trips', tripId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setTrip(docSnap.data());
    } else {
      toast.error('No Such Trip');
    }
  };

  useEffect(() => {
    if (tripId) {
      getTripData();
    }
  }, [tripId]);

  // Function to navigate to checklist with tripId
  const goToChecklist = () => {
    navigate("/checklist", { state: { tripId } });
  };

  // Function to delete the trip
  const deleteTrip = async () => {
    const docRef = doc(db, 'Trips', tripId);
    try {
      await deleteDoc(docRef);
      toast.success('Trip deleted successfully');
      navigate('/'); // Navigate to home or another page after deletion
    } catch (error) {
      toast.error('Error deleting trip: ' + error.message);
    }
  };

  return (
    <div className='py-2'>
      <Locationinfo />
      <Hotels />
      <Places />

      <div className="mt-4 flex justify-center">
        <Button onClick={goToChecklist}>
          View Checklist
        </Button>
        <Button onClick={deleteTrip} className="ml-4" variant="destructive">
          Delete Trip
        </Button>
      </div>
    </div>
  );
}

export default Mytrips;
