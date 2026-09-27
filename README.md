# PawRoute

**PawRoute** is a route-aware booking engine for mobile service businesses.

A free calendar slot is not always a good booking. PawRoute interprets a customer's request, estimates service duration, considers location and preferences, and checks the owner's existing route before recommending the appointment that best fits the day.

## Live demo

https://route-wise-paws.lovable.app/

## Core idea

> Open time ≠ good time.

Instead of simply filling an empty calendar slot, PawRoute evaluates operational fit:

- service duration
- customer location
- route impact
- downstream appointments
- customer preference
- service-specific buffers

In the demo, a 2:30 PM appointment adds only 8 minutes of travel, while a technically available 4:30 PM slot adds 31 minutes and creates backtracking.

## Owner workflow

Routine bookings run automatically. The owner only handles exceptions that require human judgment, such as:

- bite history
- out-of-area requests
- unusually long services
- excessive route impact

## Built with

- React
- TypeScript
- TanStack Router
- Tailwind CSS
- Lovable

## Challenge

Built for the 2026 Lovable Challenge on Contra.

## Author

Juan Amisano  
Senior Product & UX/UI Designer  
https://amisano-design.com/
