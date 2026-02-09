import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination'

describe('Pagination', () => {
  it('renders correctly with default props', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  it('applies custom className correctly', () => {
    render(
      <Pagination className="custom-pagination">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    expect(screen.getByRole('navigation')).toHaveClass('custom-pagination')
  })

  it('renders multiple page links', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  // it("renders ellipsis", () => {
  //   render(
  //     <Pagination>
  //       <PaginationContent>
  //         <PaginationItem>
  //           <PaginationLink href="#">1</PaginationLink>
  //         </PaginationItem>
  //         <PaginationItem>
  //           <PaginationEllipsis />
  //         </PaginationItem>
  //         <PaginationItem>
  //           <PaginationLink href="#">10</PaginationLink>
  //         </PaginationItem>
  //       </PaginationContent>
  //     </Pagination>
  //   );

  //   expect(screen.getByText("...")).toBeInTheDocument();
  // });

  it('applies correct styles to PaginationContent', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    expect(screen.getByRole('list')).toHaveClass('flex')
  })

  // it("applies correct styles to PaginationItem", () => {
  //   render(
  //     <Pagination>
  //       <PaginationContent>
  //         <PaginationItem>
  //           <PaginationLink href="#">1</PaginationLink>
  //         </PaginationItem>
  //       </PaginationContent>
  //     </Pagination>
  //   );

  //   expect(screen.getByRole("listitem")).toHaveClass("flex");
  // });

  it('applies correct styles to PaginationLink', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    const link = screen.getByRole('link')
    expect(link).toHaveClass('hover:bg-accent')
  })

  it('renders previous and next buttons with correct styles', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    const prevButton = screen.getByText('Previous').closest('a')
    const nextButton = screen.getByText('Next').closest('a')

    expect(prevButton).toHaveClass('gap-1')
    expect(nextButton).toHaveClass('gap-1')
  })
})
