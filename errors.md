nothing on the new inspection page should be compulsry, so users only tick the ones they actually follow

the view incident by id page is giving this error
Uncaught SyntaxError: "[object Object]" is not valid JSON
at JSON.parse (<anonymous>)
at IncidentDetail (IncidentDetail.jsx:119:46)
at Object.react_stack_bottom_frame (react-dom_client.js?v=e9134ef8:18509:20)
at renderWithHooks (react-dom_client.js?v=e9134ef8:5654:24)
at updateFunctionComponent (react-dom_client.js?v=e9134ef8:7475:21)
at beginWork (react-dom_client.js?v=e9134ef8:8525:20)
at runWithFiberInDEV (react-dom_client.js?v=e9134ef8:997:72)
at performUnitOfWork (react-dom_client.js?v=e9134ef8:12561:98)
at workLoopSync (react-dom_client.js?v=e9134ef8:12424:43)
at renderRootSync (react-dom_client.js?v=e9134ef8:12408:13)
in browser console

and the cloudinary api shoiuld be made as a service so the function is used to upload image and it returns url and store on db, simple.
