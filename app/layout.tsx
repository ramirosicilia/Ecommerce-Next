
import Navbar from "./components/NavBar";
import Footers from "../app/components/Footer"
import "@/app/styles/global.css"


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) 
{
  return (
    
    <html lang="en">


      <body> 
    

       <Navbar/>
        {children}

       <Footers/>
      </body>
    </html>
  );
}
