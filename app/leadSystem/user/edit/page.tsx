// file: app/(your-folder)/process/[id]/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import ApplicationCard, { Step, Application, Editing } from '@/app/components/ApplicationCard';
import apiClient from '@/app/utils/apiClient';

const ApplicationPageContent = () => {
  const params = useSearchParams();
  const userId = params.get('id');
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Editing>(null);
  const [newStepName, setNewStepName] = useState('');
  const [newStepRemark, setNewStepRemark] = useState('');
  const [newStepStatus, setNewStepStatus] = useState<Step['status']>('Pending');

  const [newAppName, setNewAppName] = useState('');
  const [appError, setAppError] = useState('');

  // Fetch user & their applications
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await apiClient.get(`/api/users?id=${userId}`);
        setUser(res.data);
        setApplications(res.data.applications || []);
      } catch (e) {
        console.error(e);
        setError('Failed to load user/apps');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Add Application
  const handleAddApplication = async () => {
    if (!newAppName.trim()) {
      setAppError('Application name is required');
      return;
    }
    setAppError('');
    if (!userId) return;

    try {
      const { data: newApp } = await apiClient.post<Application>(
        `/api/users/${userId}/application`,
        { name: newAppName.trim() }
      );
      setApplications(apps => [...apps, newApp]);
      setNewAppName('');
    } catch (e) {
      console.error(e);
      alert('Failed to add application');
    }
  };

  // Delete Application
  const handleDeleteApplication = async (appId: string) => {
    if (!confirm('Delete this application?')) return;
    try {
      await apiClient.delete(`/api/users/${userId}/application/${appId}`);
      setApplications(apps => apps.filter(a => a.id !== appId));
    } catch (e) {
      console.error(e);
      alert('Failed to delete application');
    }
  };

  // Upload image to S3 then write URL into state
  const handleImage = async (
    appId: string,
    stepId: string,
    file: File
  ) => {
    try {
      const { data } = await apiClient.post("/api/auth/sign_s3", {
        fileName: file.name,
        fileType: file.type,
        folderName: "user",
      });
      const { uploadURL, fileURL } = data;
      await fetch(uploadURL, { method: "PUT", body: file });
      setApplications(apps =>
        apps.map(a =>
          a.id === appId
            ? {
                ...a,
                steps: a.steps.map(s =>
                  s.id === stepId ? { ...s, fileUrl: fileURL } : s
                ),
              }
            : a
        )
      );
    } catch (err) {
      console.error("Upload failed", err);
      alert("File upload failed");
    } finally {
    }
  };

  // Step CRUD
  const handleAddStep = async (appId: string) => {
    if (!newStepName.trim()) return;
    try {
      const { data: newStep } = await apiClient.post<Step>(
        `/api/users/${userId}/application/${appId}/step`,
        { name: newStepName, status: newStepStatus, remark: newStepRemark, fileUrl: null }
      );
      setApplications(apps =>
        apps.map(a =>
          a.id === appId ? { ...a, steps: [...a.steps, newStep] } : a
        )
      );
      setNewStepName('');
      setNewStepRemark('');
      setNewStepStatus('Pending');
    } catch (e) {
      console.error(e);
      alert("Failed to add step");
    }
  };

  const handleSaveEdit = async (appId: string, stepId: string) => {
    const app = applications.find(a => a.id === appId);
    const step = app?.steps.find(s => s.id === stepId);
    if (!step) return;
    if (!step.name.trim()) {
      alert("Name is required");
      return;
    }
    if (!step.status) {
      alert("Status is required");
      return;
    }

    try {
      const { data: updated } = await apiClient.put<Step>(
        `/api/users/${userId}/application/${appId}/step/${stepId}`,
        { name: step.name, status: step.status, remark: step.remark, fileUrl: step.fileUrl || null }
      );
      setApplications(apps =>
        apps.map(a =>
          a.id === appId
            ? { ...a, steps: a.steps.map(s => (s.id === stepId ? updated : s)) }
            : a
        )
      );
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert("Failed to save edit");
    }
  };

  const handleDeleteStep = async (appId: string, stepId: string) => {
    if (!confirm("Delete this step?")) return;
    try {
      await apiClient.delete(
        `/api/users/${userId}/application/${appId}/step/${stepId}`
      );
      setApplications(apps =>
        apps.map(a =>
          a.id === appId
            ? { ...a, steps: a.steps.filter(s => s.id !== stepId) }
            : a
        )
      );
    } catch (e) {
      console.error(e);
      alert("Failed to delete step");
    }
  };

  const handleCancelEdit = () => setEditing(null);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <button
        onClick={() => router.back()}
        className="underline text-sm text-blue-600"
      >
        ← Back
      </button>

      <div className="flex items-center gap-4">
        <img
          src={user?.profileImage || "/profilepic.png"}
          alt="Profile"
          className="h-10 w-10 rounded-full border-2 border-deepblue"
        />
        <h1 className="font-bold">
          {user?.name} • {user?.phoneNumber}
        </h1>
      </div>

      {/* Add Application */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-1 text-sm"
          placeholder="New Application Name"
          value={newAppName}
          onChange={(e) => {
            setNewAppName(e.target.value);
            setAppError("");
          }}
        />
        <button
          onClick={handleAddApplication}
          className="bg-deepblue text-white px-4 py-1 rounded hover:bg-parrotgreen"
        >
          + Add App
        </button>
      </div>
      {appError && <p className="text-red-500 text-xs">{appError}</p>}

      {/* Application Cards */}
      {applications.map((app) => (
        <ApplicationCard
          key={app.id}
          application={app}
          editing={editing}
          onSetEditing={setEditing}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDeleteStep={handleDeleteStep}
          //@ts-ignore
          onAddStep={handleAddStep}
          handleImage={handleImage}
          newStepName={newStepName}
          setNewStepName={setNewStepName}
          newStepRemark={newStepRemark}
          setNewStepRemark={setNewStepRemark}
          newStepStatus={newStepStatus}
          setNewStepStatus={setNewStepStatus}
          setApplications={setApplications}
          onDeleteApplication={handleDeleteApplication}
        />
      ))}
    </div>
  );
};

const ApplicationPage = () => (
  <Suspense fallback={<div>Loading…</div>}>
    <ApplicationPageContent />
  </Suspense>
);

export default ApplicationPage;
