# Open-VTOP

An open-source VTOP client with automatic session management.
```bash
npx open-vtop
bunx open-vtop

npx open-vtop logs
bunx open-vtop logs
```
## Todo
- [x] Save USN and password for future use
- [x] Grab regno from the responses itself
- [x] Attendance
- [ ] Timetable
- [ ] CGPA (unsure if people actually want to see their marks and grades on this)
- [ ] Course page
- [ ] Calendar
- [x] QoL: automatic browser open, better logging
- [x] Upcoming exams

## Getting Started

### Installation

```bash
bun i
```

### Development

```bash
bun start 
bun run logs    #for logs
```

Then open http://localhost:6767

### Production

```bash
bun run build
bun start
```
