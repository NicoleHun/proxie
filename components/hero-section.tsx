import Image from "next/image"
import { Linkedin, Mail } from "lucide-react"

export function HeroSection() {
  return (
    <section className="flex flex-col items-center gap-10 px-6 py-16 md:flex-row md:items-start md:gap-16">
      {/* Profile Picture */}
      <div className="flex-shrink-0">
        <div className="relative h-52 w-44 overflow-hidden rounded-[50%] border-4 border-primary/20 shadow-lg md:h-64 md:w-52">
          <Image
            src="/images/profile.jpg"
            alt="Nicole's profile photo"
            fill
            sizes="(max-width: 768px) 176px, 208px"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-4 text-center md:text-left">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl text-balance">
          {"Hi, I'm Nicole!"}
        </h1>

        <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
          Welcome to my corner of the internet. I'm part engineer, part program
          lead, and a full-time explorer of the 'what else?' After 9+ years of
          building tech and leading programs, I've realized my favorite hobby is
          simply building—whether it's new products, meaningful connections, or
          fresh experiences.
        </p>

        <p className="text-base leading-relaxed text-muted-foreground text-pretty">
          I'll be sharing my latest projects and thoughts here, but in the
          meantime, feel free to chat with Proxie, my digital twin! I'm always
          happy to connect.
        </p>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4 md:justify-start">
          <a
            href="https://www.linkedin.com/in/zheng-nicole-huang"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            aria-label="LinkedIn profile"
          >
            <Linkedin className="h-4 w-4" />
            <span>LinkedIn</span>
          </a>
          <a
            href="mailto:nicolefanyu@gmail.com"
            className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            aria-label="Email Nicole"
          >
            <Mail className="h-4 w-4" />
            <span>nicolefanyu@gmail.com</span>
          </a>
        </div>
      </div>
    </section>
  )
}
