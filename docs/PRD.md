# Orbit — Product Requirements

## Overview

Orbit is a personal productivity app that brings a user's calendar, tasks, and reminders together in one place, with an AI-generated daily briefing to help them plan the day ahead. It is built as the capstone project for Code Impact training, exercising the full stack the rest of the curriculum covered: React + TypeScript on the frontend, Node + Express + TypeScript on the backend, Postgres + Prisma for the database, JWT-based auth, and Railway for deployment.

## Who it's for

A single user managing their own schedule. Every piece of data — events, tasks, reminders, and profile — belongs to the authenticated user who created it. Users cannot see or modify each other's data. The app is not designed for teams, sharing, or collaboration.

## What it does

The app has five pages. **Dashboard** is the landing screen after login: it shows today's date, today's events in chronological order, overdue and due-today tasks, reminders due today, and a button that calls the Claude API to generate a personalized "your day ahead" briefing. **Calendar** offers month, week, and day views; users can create, edit, and delete events; tasks with due dates and reminders with scheduled times appear on their respective dates. **Tasks** lists upcoming and completed tasks in separate sections, with a backlog section for undated tasks; users can create, edit, complete, and delete tasks, and optionally link a task to a calendar event as a precursor. **Reminders** supports full CRUD with a repeat frequency (none, daily, or weekly); marking a non-repeating reminder done archives it, while marking a repeating one done schedules the next occurrence; browser notifications fire when a due reminder is detected and the app is open. **Profile** displays the user's name and email from signup and lets them update their display name and sign out.

## Out of scope

Team features, sharing, collaboration, password reset, email verification, profile picture upload, mobile native apps, offline mode, and any integration beyond the Claude API for the daily briefing (and optionally OpenWeatherMap for the extra-credit weather widget).
