'use client';

/* Copy this adapter with the workflow/core modules, brand-system.js, their
   styles and supplied assets. Route cleanup releases timers and GPU resources. */
import { useEffect, useRef } from 'react';
import { mountWorkflow, mountControlGate } from '../public/enhancements/workflow.js';
import { mountCoreScene } from '../public/enhancements/core-scene.js';
import { mountTraceLedger } from '../public/enhancements/trace-ledger.js';
import '../public/enhancements/workflow.css';
import '../public/enhancements/btcvp-flow.css';
import '../public/enhancements/core-scene.css';
import '../public/enhancements/brand-system.css';
import '../public/enhancements/trace-ledger.css';
import '../public/enhancements/typography.css';

export function NaroWorkflow() {
 const host = useRef<HTMLDivElement>(null);
 useEffect(() => {
   if (host.current) return mountWorkflow(host.current);
 }, []);
 return <div ref={host} />;
}

export function VetaControlGate() {
 const host = useRef<HTMLDivElement>(null);
 useEffect(() => {
   if (host.current) return mountControlGate(host.current);
 }, []);
 return <div ref={host} />;
}

export function NaroCoreScene({ variant = 'hero' }: { variant?: 'hero' | 'vault' }) {
 const host = useRef<HTMLDivElement>(null);
 useEffect(() => {
   if (host.current) return mountCoreScene(host.current, { variant, labels: 'footer', controls: false });
 }, [variant]);
 return <div ref={host} style={{ width: '100%', minHeight: 540 }} />;
}

// Optional React wrapper for the transparency module. Keep its records illustrative.
export function NaroTraceLedger() {
 const host = useRef<HTMLDivElement>(null);
 useEffect(() => { if (host.current) return mountTraceLedger(host.current); }, []);
 return <div ref={host} />;
}
