'use client';

import { useParams } from 'next/navigation';
import ParticipantPlayPage from '../page';

export default function PlayRoomPage() {
  const params = useParams();
  const roomCode = params.roomCode as string;

  return <ParticipantPlayPage />;
}
