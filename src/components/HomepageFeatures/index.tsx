import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg?: React.ComponentType<React.ComponentProps<'svg'>>;
  ImageSrc?: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Deploy',
    ImageSrc: '/img/magician.png',
    description: (
      <>
        foc.fun was designed to make Starknet development magical. Deploy your 
        decentralized applications with simple commands and get running quickly.
      </>
    ),
  },
  {
    title: 'Focus on Your App',
    ImageSrc: '/img/rainbow.png',
    description: (
      <>
        foc.fun handles the infrastructure complexity so you can focus on building 
        amazing user experiences. Use our modular <code>Registry</code>, <code>Accounts</code>, 
        <code>Paymaster</code>, and <code>Events</code> modules.
      </>
    ),
  },
  {
    title: 'Powered by Starknet',
    ImageSrc: '/img/starknet-logo.png',
    description: (
      <>
        Built specifically for Starknet's Cairo smart contracts and account abstraction.
        Leverage zero-knowledge proofs, gasless transactions, and next-gen blockchain features.
      </>
    ),
  },
];

function Feature({title, Svg, ImageSrc, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        {ImageSrc ? (
          <img 
            src={ImageSrc} 
            alt={title}
            className={styles.featureSvg}
            role="img"
          />
        ) : Svg ? (
          <Svg className={styles.featureSvg} role="img" />
        ) : null}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
