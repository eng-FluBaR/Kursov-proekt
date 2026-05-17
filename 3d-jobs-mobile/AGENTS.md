# App Purpose
Mobile companion to the time tracker. Users log time on projects and view basic stats from their phone
# Tech Guidelines

	Technologies: Expo, React Native, Expo Router
	Back-end: 3d-jobs RESTful API, with "Bearer token" auth
    Back-end API source code: "....\3d-jobs-web\SRC\app\.."
# Architectural Guidelines:
    modular design - split the app into meaninful components, to avoid too much code in a single file and reuse repeating code 
    RESTful API backend

# Mobile User Interface Gudelines
    Implement user-friendly UI, stack navigation, responsive layout
	Mobile UI Alerts: ensure all native alerts, confirms and other system dialogs have a fallback for Web (implemented as modal popups)