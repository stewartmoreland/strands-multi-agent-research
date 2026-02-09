import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'

describe('Breadcrumb', () => {
  it('renders correctly with default props', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Current</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('applies custom className correctly', () => {
    render(
      <Breadcrumb className="custom-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    expect(screen.getByRole('navigation')).toHaveClass('custom-breadcrumb')
  })

  // it("renders multiple breadcrumb items with separators", () => {
  //   render(
  //     <Breadcrumb>
  //       <BreadcrumbList>
  //         <BreadcrumbItem>
  //           <BreadcrumbLink href="/">Home</BreadcrumbLink>
  //         </BreadcrumbItem>
  //         <BreadcrumbSeparator />
  //         <BreadcrumbItem>
  //           <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
  //         </BreadcrumbItem>
  //         <BreadcrumbSeparator />
  //         <BreadcrumbItem>
  //           <BreadcrumbPage>Current</BreadcrumbPage>
  //         </BreadcrumbItem>
  //       </BreadcrumbList>
  //     </Breadcrumb>
  //   );

  //   expect(screen.getByText("Home")).toBeInTheDocument();
  //   expect(screen.getByText("Docs")).toBeInTheDocument();
  //   expect(screen.getByText("Current")).toBeInTheDocument();
  //   expect(screen.getAllByRole("presentation")).toHaveLength(2);
  // });

  // it("renders custom separator", () => {
  //   render(
  //     <Breadcrumb>
  //       <BreadcrumbList>
  //         <BreadcrumbItem>
  //           <BreadcrumbLink href="/">Home</BreadcrumbLink>
  //         </BreadcrumbItem>
  //         <BreadcrumbSeparator>
  //           <Slash className="h-4 w-4" />
  //         </BreadcrumbSeparator>
  //         <BreadcrumbItem>
  //           <BreadcrumbPage>Current</BreadcrumbPage>
  //         </BreadcrumbItem>
  //       </BreadcrumbList>
  //     </Breadcrumb>
  //   );

  //   expect(screen.getByRole("presentation")).toBeInTheDocument();
  // });

  // it("renders ellipsis for collapsed state", () => {
  //   render(
  //     <Breadcrumb>
  //       <BreadcrumbList>
  //         <BreadcrumbItem>
  //           <BreadcrumbLink href="/">Home</BreadcrumbLink>
  //         </BreadcrumbItem>
  //         <BreadcrumbSeparator />
  //         <BreadcrumbItem>
  //           <BreadcrumbEllipsis />
  //         </BreadcrumbItem>
  //         <BreadcrumbSeparator />
  //         <BreadcrumbItem>
  //           <BreadcrumbPage>Current</BreadcrumbPage>
  //         </BreadcrumbItem>
  //       </BreadcrumbList>
  //     </Breadcrumb>
  //   );

  //   expect(
  //     screen.getByRole("presentation", { name: /more/i })
  //   ).toBeInTheDocument();
  // });

  it('applies correct styles to BreadcrumbList', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    const list = screen.getByRole('list')
    expect(list).toHaveClass('flex')
    expect(list).toHaveClass('items-center')
  })

  it('applies correct styles to BreadcrumbItem', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    expect(screen.getByRole('listitem')).toHaveClass('inline-flex')
  })

  it('applies correct styles to BreadcrumbLink', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    const link = screen.getByRole('link')
    expect(link).toHaveClass('hover:text-foreground')
    expect(link).toHaveClass('transition-colors')
  })

  it('applies correct styles to BreadcrumbPage', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Current</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    const page = screen.getByRole('link')
    expect(page).toHaveClass('text-foreground')
    expect(page).toHaveClass('font-normal')
    expect(page).toHaveAttribute('aria-current', 'page')
  })
})
